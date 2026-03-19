import { NextResponse } from "next/server"
import { db } from "@/db"
import { drNewsArticle, setting } from "@/db/schema"
import { desc, eq } from "drizzle-orm"

const DR_RSS_URL = "https://www.dr.dk/nyheder/service/feeds/senestenyt"
const FETCH_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes

type DrNewsItem = {
  title: string
  link: string
  description: string
  content: string
  pubDate: string
  imageUrl?: string | null
  imageCaption?: string | null
  author?: string | null
  bodyParagraphs?: string[]
  source: "dr"
}

function isUsableImageUrl(url: string | null | undefined): boolean {
  if (!url) return false
  const normalized = url.trim().toLowerCase()
  if (!normalized.startsWith("http")) return false
  if (normalized.includes("/drdk/umbraco-images/") && normalized.includes(".png")) return false
  return true
}

function decodeEntities(text: string) {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim()
}

function cleanHtml(text: string) {
  return text
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .trim()
}

function stripTags(html: string) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function extractTag(source: string, tag: string) {
  const match = source.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"))
  return decodeEntities(match?.[1] ?? "")
}

function extractShortNewsArticleHtml(html: string): string | null {
  const match = html.match(
    /<article[^>]*class="[^"]*hydra-latest-news-page-short-news-article[^"]*"[^>]*itemtype="https:\/\/schema\.org\/NewsArticle"[^>]*>[\s\S]*?<\/article>/i
  )
  return match?.[0] ?? null
}

function extractParagraphsFromArticleBody(sourceHtml: string): string[] {
  const bodyMatch = sourceHtml.match(
    /<div[^>]*itemprop="articleBody"[^>]*>([\s\S]*?)<\/div>\s*(?:<div[^>]*class="[^"]*hydra-latest-news-page-short-news-article__share|<\/article>)/i
  )
  if (!bodyMatch?.[1]) return []

  const paragraphs: string[] = []
  const pMatches = bodyMatch[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)
  for (const pMatch of pMatches) {
    const text = stripTags(decodeEntities(pMatch[1]))
    if (text.length > 1) paragraphs.push(text)
  }
  return paragraphs
}

function parseRssItems(xml: string): DrNewsItem[] {
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? []
  return itemMatches.map((itemXml) => ({
    title: extractTag(itemXml, "title"),
    link: extractTag(itemXml, "link"),
    description: extractTag(itemXml, "description"),
    content: cleanHtml(extractTag(itemXml, "content:encoded")),
    pubDate: extractTag(itemXml, "pubDate"),
    imageUrl: null,
    imageCaption: null,
    author: null,
    bodyParagraphs: [],
    source: "dr",
  }))
}

async function fetchFullArticle(item: DrNewsItem): Promise<DrNewsItem> {
  try {
    const url = item.link.startsWith("http") ? item.link : `https://www.dr.dk${item.link}`

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "da-DK,da;q=0.9,en;q=0.8",
      },
    })

    if (!response.ok) return item

    const html = await response.text()
    const shortArticleHtml = extractShortNewsArticleHtml(html)
    const sourceHtml = shortArticleHtml ?? html

    const imageMatch = sourceHtml.match(
      /<div\s+itemprop="image"[\s\S]*?<meta\s+itemprop="url"\s+content="([^"]+)"/i
    )
    const primaryImageUrl = imageMatch?.[1]
    if (isUsableImageUrl(primaryImageUrl)) item.imageUrl = primaryImageUrl!

    if (!item.imageUrl) {
      const ogImageMatch = sourceHtml.match(
        /<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i
      )
      if (isUsableImageUrl(ogImageMatch?.[1])) item.imageUrl = ogImageMatch![1]
    }

    const headlineMatch = sourceHtml.match(
      /<[^>]*itemprop="headline"[^>]*>([\s\S]*?)<\/(?:h1|h2|div)>/i
    )
    const headlineText = stripTags(decodeEntities(headlineMatch?.[1] ?? ""))
    if (headlineText.length > 3) item.title = headlineText

    const captionMatch = sourceHtml.match(
      /<span\s+class="dre-caption[^"]*"[^>]*>([\s\S]*?)<\/span>/i
    )
    if (captionMatch?.[1]) {
      const caption = decodeEntities(captionMatch[1]).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
      if (caption.length > 10 && caption.length <= 500) item.imageCaption = caption
    }

    const authorMatch = sourceHtml.match(
      /<div\s+class="dre-byline[\s\S]*?<span\s+itemprop="name">([^<]+)<\/span>/i
    )
    if (authorMatch?.[1]) item.author = authorMatch[1].trim()

    const dateMatch = sourceHtml.match(
      /<meta\s+itemprop="datePublished"\s+content="([^"]+)"/i
    )
    if (dateMatch?.[1]) item.pubDate = dateMatch[1]

    const bodyParagraphs = extractParagraphsFromArticleBody(sourceHtml)
    if (bodyParagraphs.length > 0) {
      item.bodyParagraphs = bodyParagraphs
      item.content = bodyParagraphs.join("\n\n")
    }

    if (!item.bodyParagraphs || item.bodyParagraphs.length === 0) {
      const speechMatches = html.matchAll(
        /<div\s+class="dre-speech"[^>]*>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/div>/gi
      )
      const paragraphs: string[] = []
      for (const match of speechMatches) {
        const text = stripTags(decodeEntities(match[1]))
        if (text.length > 1) paragraphs.push(text)
      }
      if (paragraphs.length > 0) {
        item.bodyParagraphs = paragraphs
        item.content = paragraphs.join("\n\n")
      }
    }

    return item
  } catch (err) {
    console.error(`Failed to fetch article: ${item.link}`, err)
    return item
  }
}

export async function GET() {
  try {
    const now = new Date()

    // 1. Check when we last fetched from the RSS
    const [lastFetchSetting] = await db
      .select()
      .from(setting)
      .where(eq(setting.key, "dr_news_last_fetched"))
      .limit(1)

    const lastFetchedAt = lastFetchSetting?.value ? new Date(lastFetchSetting.value) : null
    const timeSinceLastFetch = lastFetchedAt ? now.getTime() - lastFetchedAt.getTime() : Infinity

    // 2. Fetch RSS XML to detect new articles
    const rssResponse = await fetch(DR_RSS_URL, {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 60 },
    })

    if (!rssResponse.ok) {
      // RSS unavailable — serve from DB if we have articles
      const cached = await db
        .select()
        .from(drNewsArticle)
        .orderBy(desc(drNewsArticle.pubDate))
        .limit(14)

      if (cached.length > 0) {
        return NextResponse.json({ source: DR_RSS_URL, fetchedAt: now.toISOString(), items: cached.map(toApiItem) })
      }

      return NextResponse.json(
        { error: "Could not fetch DR RSS feed", status: rssResponse.status },
        { status: 502 }
      )
    }

    const xml = await rssResponse.text()
    const rssItems = parseRssItems(xml).filter((item) => item.title && item.link)

    // 3. Find which RSS links are new (not yet in DB)
    const existingLinks = new Set(
      (await db.select({ link: drNewsArticle.link }).from(drNewsArticle)).map((r) => r.link)
    )
    const newItems = rssItems.filter((item) => !existingLinks.has(item.link))

    // 4. Fetch full content only when:
    //    a) There are new articles not yet in the DB (user load or periodic)
    //    b) 10 minutes have passed since last fetch (re-enrich top items for freshness)
    const hasNewArticles = newItems.length > 0
    const intervalElapsed = timeSinceLastFetch >= FETCH_INTERVAL_MS

    if (hasNewArticles || intervalElapsed) {
      // Enrich new articles (if any), and re-enrich all top items on interval
      const itemsToEnrich = hasNewArticles
        ? newItems.slice(0, 14)
        : rssItems.slice(0, 14)

      const enriched = await Promise.all(itemsToEnrich.map(fetchFullArticle))

      // Upsert into DB
      for (const item of enriched) {
        const pubDateValue = item.pubDate ? new Date(item.pubDate) : null
        if (pubDateValue && isNaN(pubDateValue.getTime())) continue // skip unparseable dates

        await db
          .insert(drNewsArticle)
          .values({
            link: item.link,
            title: item.title,
            description: item.description,
            content: item.content,
            pubDate: pubDateValue,
            imageUrl: item.imageUrl ?? null,
            imageCaption: item.imageCaption ?? null,
            author: item.author ?? null,
            bodyParagraphs: item.bodyParagraphs ?? [],
            fetchedAt: now,
          })
          .onConflictDoUpdate({
            target: drNewsArticle.link,
            set: {
              title: item.title,
              description: item.description,
              content: item.content,
              pubDate: pubDateValue,
              imageUrl: item.imageUrl ?? null,
              imageCaption: item.imageCaption ?? null,
              author: item.author ?? null,
              bodyParagraphs: item.bodyParagraphs ?? [],
              fetchedAt: now,
            },
          })
      }

      // Update last fetch timestamp
      await db
        .insert(setting)
        .values({ key: "dr_news_last_fetched", value: now.toISOString(), updatedAt: now })
        .onConflictDoUpdate({
          target: setting.key,
          set: { value: now.toISOString(), updatedAt: now },
        })
    }

    // 5. Return articles from DB
    const articles = await db
      .select()
      .from(drNewsArticle)
      .orderBy(desc(drNewsArticle.pubDate))
      .limit(14)

    return NextResponse.json(
      {
        source: DR_RSS_URL,
        fetchedAt: now.toISOString(),
        items: articles.map(toApiItem),
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    )
  } catch (err) {
    console.error("DR news fetch error:", err)
    return NextResponse.json({ error: "Unexpected DR news error" }, { status: 500 })
  }
}

function toApiItem(a: typeof drNewsArticle.$inferSelect) {
  return {
    title: a.title,
    link: a.link,
    description: a.description,
    content: a.content,
    pubDate: a.pubDate?.toISOString() ?? null,
    imageUrl: a.imageUrl,
    imageCaption: a.imageCaption,
    author: a.author,
    bodyParagraphs: (a.bodyParagraphs as string[]) ?? [],
    source: "dr",
  }
}

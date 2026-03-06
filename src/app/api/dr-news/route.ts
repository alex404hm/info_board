import { NextResponse } from "next/server"

const DR_RSS_URL = "https://www.dr.dk/nyheder/service/feeds/senestenyt"

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
    if (text.length > 1) {
      paragraphs.push(text)
    }
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

/**
 * Fetch full article content from DR.dk article page
 */
async function fetchFullArticle(item: DrNewsItem): Promise<DrNewsItem> {
  try {
    // Ensure link is absolute
    const url = item.link.startsWith("http")
      ? item.link
      : `https://www.dr.dk${item.link}`

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "da-DK,da;q=0.9,en;q=0.8",
      },
      next: { revalidate: 1800 },
    })

    if (!response.ok) return item

    const html = await response.text()

    const shortArticleHtml = extractShortNewsArticleHtml(html)
    const sourceHtml = shortArticleHtml ?? html

    // Extract image URL from <div itemprop="image">...<meta itemprop="url" content="...">
    const imageMatch = sourceHtml.match(
      /<div\s+itemprop="image"[\s\S]*?<meta\s+itemprop="url"\s+content="([^"]+)"/i
    )
    const primaryImageUrl = imageMatch?.[1]
    if (isUsableImageUrl(primaryImageUrl)) {
      item.imageUrl = primaryImageUrl
    }

    // Fallback: try og:image meta tag
    if (!item.imageUrl) {
      const ogImageMatch = sourceHtml.match(
        /<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i
      )
      const ogImageUrl = ogImageMatch?.[1]
      if (isUsableImageUrl(ogImageUrl)) {
        item.imageUrl = ogImageUrl
      }
    }

    // Extract headline text from article page if present.
    const headlineMatch = sourceHtml.match(
      /<[^>]*itemprop="headline"[^>]*>([\s\S]*?)<\/(?:h1|h2|div)>/i
    )
    const headlineText = stripTags(decodeEntities(headlineMatch?.[1] ?? ""))
    if (headlineText.length > 3) {
      item.title = headlineText
    }

    // Extract image caption from <span class="dre-caption">
    const captionMatch = sourceHtml.match(
      /<span\s+class="dre-caption[^"]*"[^>]*>([\s\S]*?)<\/span>/i
    )
    if (captionMatch?.[1]) {
      // Decode entities first, then strip any remaining tags
      const caption = decodeEntities(captionMatch[1])
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim()
      
      if (caption.length > 10 && caption.length <= 500) {
        item.imageCaption = caption
      }
    }

    // Extract author from byline: <span itemprop="name">Author Name</span>
    const authorMatch = sourceHtml.match(
      /<div\s+class="dre-byline[\s\S]*?<span\s+itemprop="name">([^<]+)<\/span>/i
    )
    if (authorMatch?.[1]) {
      item.author = authorMatch[1].trim()
    }

    // Extract published date from <meta itemprop="datePublished" content="...">
    const dateMatch = sourceHtml.match(
      /<meta\s+itemprop="datePublished"\s+content="([^"]+)"/i
    )
    if (dateMatch?.[1]) {
      item.pubDate = dateMatch[1]
    }

    // Extract all articleBody paragraphs from short-news page structure first.
    const bodyParagraphs = extractParagraphsFromArticleBody(sourceHtml)
    if (bodyParagraphs.length > 0) {
      item.bodyParagraphs = bodyParagraphs
      item.content = bodyParagraphs.join("\n\n")
    }

    // Fallback: Extract from dre-speech divs
    if (!item.bodyParagraphs || item.bodyParagraphs.length === 0) {
      const speechMatches = html.matchAll(
        /<div\s+class="dre-speech"[^>]*>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/div>/gi
      )
      const paragraphs: string[] = []
      for (const match of speechMatches) {
        const text = stripTags(decodeEntities(match[1]))
        if (text.length > 1) {
          paragraphs.push(text)
        }
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
    const response = await fetch(DR_RSS_URL, {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "Could not fetch DR RSS feed", status: response.status },
        { status: 502 }
      )
    }

    const xml = await response.text()
    let items = parseRssItems(xml).filter((item) => item.title && item.link)

    // Fetch full article content for all visible feed items.
    const topItems = items.slice(0, 14)
    const enriched = await Promise.all(topItems.map(fetchFullArticle))

    // Combine enriched items with remaining items
    items = [...enriched, ...items.slice(10)]

    return NextResponse.json(
      {
        source: DR_RSS_URL,
        fetchedAt: new Date().toISOString(),
        items,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=180, stale-while-revalidate=900",
        },
      }
    )
  } catch (err) {
    console.error("DR news fetch error:", err)
    return NextResponse.json(
      { error: "Unexpected DR news error" },
      { status: 500 }
    )
  }
}

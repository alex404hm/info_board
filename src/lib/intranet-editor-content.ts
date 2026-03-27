const HTML_TAG_PATTERN = /<([a-z][\w-]*)(\s|>)/i
const MDX_IMAGE_PATTERN =
  /<IntranetImage\s+src="([^"]+)"(?:\s+alt="([^"]*)")?(?:\s+width="(\d+)")?\s*\/>/gi
const MDX_FILE_PATTERN =
  /<IntranetFile\s+href="([^"]+)"(?:\s+title="([^"]*)")?(?:\s+height="(\d+)")?\s*\/>/gi

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function applyInlineMarkdown(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>")
    .replace(/~~([^~]+)~~/g, "<s>$1</s>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
  }

function renderParagraph(lines: string[]) {
  const content = applyInlineMarkdown(lines.join("<br />"))
  return `<p>${content}</p>`
}

export function normalizeIntranetEditorContent(content: string) {
  const normalized = content
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .replace(MDX_IMAGE_PATTERN, (_, src: string, alt = "", width = "") => {
      return `<img src="${src}" alt="${alt}"${width ? ` width="${width}"` : ""} />`
    })
    .replace(MDX_FILE_PATTERN, (_, href: string, title = "", height = "") => {
      const label = title || href.split("/").pop() || href
      return `<div data-type="pdf-block" data-src="${href}" data-title="${label}"${height ? ` data-height="${height}"` : ""}></div>`
    })
    .trim()

  if (!normalized) return ""

  const lines = normalized.split("\n")
  const blocks: string[] = []
  const paragraph: string[] = []
  let listType: "ul" | "ol" | null = null
  let listItems: string[] = []
  let inCodeBlock = false
  let codeBlockLines: string[] = []
  let codeBlockLang = ""

  function flushParagraph() {
    if (!paragraph.length) return
    blocks.push(renderParagraph(paragraph))
    paragraph.length = 0
  }

  function flushList() {
    if (!listType || !listItems.length) return
    blocks.push(`<${listType}>${listItems.join("")}</${listType}>`)
    listType = null
    listItems = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    // ── Code block handling ──────────────────────────────────────────────────
    if (inCodeBlock) {
      if (line === "```") {
        const escapedCode = escapeHtml(codeBlockLines.join("\n"))
        const langAttr = codeBlockLang ? ` class="language-${codeBlockLang}"` : ""
        blocks.push(`<pre><code${langAttr}>${escapedCode}</code></pre>`)
        codeBlockLines = []
        codeBlockLang = ""
        inCodeBlock = false
      } else {
        codeBlockLines.push(rawLine)
      }
      continue
    }

    const codeBlockStart = line.match(/^```(\w*)$/)
    if (codeBlockStart) {
      flushParagraph()
      flushList()
      inCodeBlock = true
      codeBlockLang = codeBlockStart[1]
      continue
    }
    // ────────────────────────────────────────────────────────────────────────

    if (!line) {
      flushParagraph()
      flushList()
      continue
    }

    // Raw HTML line (e.g. from MDX component replacement) — pass through as-is
    if (line.startsWith("<")) {
      flushParagraph()
      flushList()
      blocks.push(line)
      continue
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      flushParagraph()
      flushList()
      const level = Math.min(Number(headingMatch[1].length), 6)
      blocks.push(`<h${level}>${applyInlineMarkdown(headingMatch[2])}</h${level}>`)
      continue
    }

    if (/^---+$/.test(line) || /^\*\*\*+$/.test(line)) {
      flushParagraph()
      flushList()
      blocks.push("<hr />")
      continue
    }

    const blockquoteMatch = line.match(/^>\s?(.*)$/)
    if (blockquoteMatch) {
      flushParagraph()
      flushList()
      blocks.push(`<blockquote><p>${applyInlineMarkdown(blockquoteMatch[1])}</p></blockquote>`)
      continue
    }

    const unorderedMatch = line.match(/^[-*+]\s+(.*)$/)
    if (unorderedMatch) {
      flushParagraph()
      if (listType && listType !== "ul") flushList()
      listType = "ul"
      listItems.push(`<li><p>${applyInlineMarkdown(unorderedMatch[1])}</p></li>`)
      continue
    }

    const orderedMatch = line.match(/^\d+\.\s+(.*)$/)
    if (orderedMatch) {
      flushParagraph()
      if (listType && listType !== "ol") flushList()
      listType = "ol"
      listItems.push(`<li><p>${applyInlineMarkdown(orderedMatch[1])}</p></li>`)
      continue
    }

    paragraph.push(escapeHtml(line))
  }

  // Flush any unclosed code block
  if (inCodeBlock && codeBlockLines.length) {
    const escapedCode = escapeHtml(codeBlockLines.join("\n"))
    blocks.push(`<pre><code>${escapedCode}</code></pre>`)
  }

  flushParagraph()
  flushList()

  return blocks.join("")
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function normalizePlainText(value: string) {
  return value.replace(/\u00a0/g, " ")
}

function escapeAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function serializeNodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return normalizePlainText(node.textContent ?? "")
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return ""
  }

  const element = node as HTMLElement
  const tag = element.tagName.toLowerCase()
  const children = Array.from(element.childNodes).map(serializeNodeToMarkdown).join("")
  const text = collapseWhitespace(children)

  switch (tag) {
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6": {
      const level = Number(tag.slice(1))
      return `${"#".repeat(level)} ${text}`.trim()
    }
    case "p":
      return children.trim()
    case "br":
      return "  \n"
    case "strong":
    case "b":
      return text ? `**${text}**` : ""
    case "em":
    case "i":
      return text ? `*${text}*` : ""
    case "s":
    case "del":
      return text ? `~~${text}~~` : ""
    case "code":
      return element.closest("pre") ? element.textContent ?? "" : `\`${element.textContent ?? ""}\``
    case "pre":
      return `\`\`\`\n${element.textContent?.trim() ?? ""}\n\`\`\``
    case "a": {
      const href = element.getAttribute("href") ?? ""
      const title = text || element.getAttribute("title") || href
      if (!href) return text
      if (href.toLowerCase().endsWith(".pdf")) {
        return `<IntranetFile href="${escapeAttribute(href)}" title="${escapeAttribute(title)}" />`
      }
      return `[${title}](${href})`
    }
    case "img": {
      const src = element.getAttribute("src") ?? ""
      const alt = element.getAttribute("alt") ?? ""
      const width = element.getAttribute("width")
      return src
        ? `<IntranetImage src="${escapeAttribute(src)}"${alt ? ` alt="${escapeAttribute(alt)}"` : ""}${width ? ` width="${width}"` : ""} />`
        : ""
    }
    case "blockquote": {
      const quote = children
        .trim()
        .split("\n")
        .map((line) => `> ${line.trim()}`)
        .join("\n")
      return quote
    }
    case "hr":
      return "---"
    case "ul":
      return Array.from(element.children)
        .map((child) => {
          const line = serializeNodeToMarkdown(child).trim()
          return line ? `- ${line}` : ""
        })
        .filter(Boolean)
        .join("\n")
    case "ol":
      return Array.from(element.children)
        .map((child, index) => {
          const line = serializeNodeToMarkdown(child).trim()
          return line ? `${index + 1}. ${line}` : ""
        })
        .filter(Boolean)
        .join("\n")
    case "li": {
      const line = Array.from(element.childNodes)
        .map(serializeNodeToMarkdown)
        .join("")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
      return line.replace(/\n/g, "\n  ")
    }
    case "div": {
      // Custom pdf-block node rendered by Tiptap
      if (element.getAttribute("data-type") === "pdf-block") {
        const src = element.getAttribute("data-src") ?? ""
        const title = element.getAttribute("data-title") ?? ""
        const height = element.getAttribute("data-height")
        if (!src) return ""
        return `<IntranetFile href="${escapeAttribute(src)}" title="${escapeAttribute(title)}"${height && height !== "480" ? ` height="${height}"` : ""} />`
      }
      if (element.querySelector("iframe")) {
        const iframe = element.querySelector("iframe")
        const src = iframe?.getAttribute("src") ?? ""
        if (src.toLowerCase().includes(".pdf")) {
          const cleanSrc = src.split("#")[0]
          const title = iframe?.getAttribute("title") ?? cleanSrc.split("/").pop() ?? "Dokument"
          return `<IntranetFile href="${escapeAttribute(cleanSrc)}" title="${escapeAttribute(title)}" />`
        }
      }
      return element.outerHTML.trim()
    }
    case "figure":
      if (element.querySelector("iframe")) {
        const iframe = element.querySelector("iframe")
        const src = iframe?.getAttribute("src") ?? ""
        if (src.toLowerCase().includes(".pdf")) {
          const cleanSrc = src.split("#")[0]
          const title = iframe?.getAttribute("title") ?? cleanSrc.split("/").pop() ?? "Dokument"
          return `<IntranetFile href="${escapeAttribute(cleanSrc)}" title="${escapeAttribute(title)}" />`
        }
      }
      return element.outerHTML.trim()
    case "iframe": {
      const src = element.getAttribute("src") ?? ""
      if (src.toLowerCase().includes(".pdf")) {
        const cleanSrc = src.split("#")[0]
        const title = element.getAttribute("title") ?? cleanSrc.split("/").pop() ?? "Dokument"
        return `<IntranetFile href="${escapeAttribute(cleanSrc)}" title="${escapeAttribute(title)}" />`
      }
      return element.outerHTML.trim()
    }
    default:
      return children.trim()
  }
}

export function convertIntranetContentToMarkdown(content: string) {
  const normalized = content.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim()

  if (!normalized) return ""
  if (!HTML_TAG_PATTERN.test(normalized)) return normalized
  if (typeof DOMParser === "undefined") return normalized

  const document = new DOMParser().parseFromString(normalized, "text/html")
  const blocks = Array.from(document.body.childNodes)
    .map(serializeNodeToMarkdown)
    .map((block) => block.trim())
    .filter(Boolean)

  return blocks.join("\n\n").replace(/\n{3,}/g, "\n\n").trim()
}

export function buildIntranetMarkdownDocument({
  title,
  subtitle,
  content,
}: {
  title: string
  subtitle?: string | null
  content: string
}) {
  const blocks: string[] = []
  const normalizedTitle = collapseWhitespace(title)
  const normalizedSubtitle = collapseWhitespace(subtitle ?? "")
  const normalizedContent = convertIntranetContentToMarkdown(content)

  if (normalizedTitle) {
    blocks.push(`# ${normalizedTitle}`)
  }

  if (normalizedSubtitle) {
    blocks.push(normalizedSubtitle)
  }

  if (normalizedContent) {
    blocks.push(normalizedContent)
  }

  return blocks.join("\n\n").trim()
}

export function isLikelyHtmlContent(content: string) {
  return /<\/?[a-z][\s\S]*>/i.test(content)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function parseInlineMarkdown(value: string) {
  let html = escapeHtml(value)

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>")

  return html
}

function markdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n")
  const blocks: string[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index].trimEnd()

    if (!line.trim()) {
      index += 1
      continue
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      blocks.push(`<h${level}>${parseInlineMarkdown(headingMatch[2])}</h${level}>`)
      index += 1
      continue
    }

    if (line.startsWith("> ")) {
      const quoteLines: string[] = []
      while (index < lines.length && lines[index].trim().startsWith("> ")) {
        quoteLines.push(parseInlineMarkdown(lines[index].trim().slice(2)))
        index += 1
      }
      blocks.push(`<blockquote><p>${quoteLines.join("<br />")}</p></blockquote>`)
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(`<li>${parseInlineMarkdown(lines[index].trim().replace(/^[-*]\s+/, ""))}</li>`)
        index += 1
      }
      blocks.push(`<ul>${items.join("")}</ul>`)
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(`<li>${parseInlineMarkdown(lines[index].trim().replace(/^\d+\.\s+/, ""))}</li>`)
        index += 1
      }
      blocks.push(`<ol>${items.join("")}</ol>`)
      continue
    }

    if (line.includes("|")) {
      const tableLines: string[] = []
      while (index < lines.length && lines[index].includes("|")) {
        tableLines.push(lines[index].trim())
        index += 1
      }

      if (tableLines.length >= 2 && /^\|?[\s:-|]+\|?$/.test(tableLines[1])) {
        const cells = (row: string) =>
          row
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((cell) => cell.trim())

        const headers = cells(tableLines[0])
        const bodyRows = tableLines.slice(2)

        blocks.push(
          `<table><thead><tr>${headers.map((cell) => `<th>${parseInlineMarkdown(cell)}</th>`).join("")}</tr></thead><tbody>${bodyRows
            .map((row) => `<tr>${cells(row).map((cell) => `<td>${parseInlineMarkdown(cell)}</td>`).join("")}</tr>`)
            .join("")}</tbody></table>`
        )
        continue
      }

      blocks.push(`<p>${parseInlineMarkdown(tableLines.join(" "))}</p>`)
      continue
    }

    const paragraphLines: string[] = []
    while (index < lines.length && lines[index].trim()) {
      paragraphLines.push(parseInlineMarkdown(lines[index].trim()))
      index += 1
    }

    blocks.push(`<p>${paragraphLines.join("<br />")}</p>`)
  }

  return blocks.join("")
}

export function normalizeEditorContent(content: string) {
  const trimmed = content.trim()
  if (!trimmed) return "<p></p>"
  return isLikelyHtmlContent(trimmed) ? trimmed : markdownToHtml(trimmed)
}

export function stripIntranetContent(content: string) {
  if (!content) return ""
  if (isLikelyHtmlContent(content)) {
    return content
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim()
  }

  return content.replace(/\n+/g, " ").trim()
}

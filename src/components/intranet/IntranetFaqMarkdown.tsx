"use client"

import { useRouter } from "next/navigation"
import type { MouseEvent } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { isLikelyHtmlContent } from "@/lib/intranet-content"

type LinkBehavior = "webview" | "default" | "disabled"

export function IntranetFaqMarkdown({
  content,
  linkBehavior = "default",
}: {
  content: string
  linkBehavior?: LinkBehavior
}) {
  const router = useRouter()

  function handleHtmlClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement | null
    const anchor = target?.closest("a") as HTMLAnchorElement | null
    if (!anchor) return

    if (linkBehavior === "disabled") {
      event.preventDefault()
      return
    }

    if (linkBehavior !== "webview") return

    const href = anchor.getAttribute("href") ?? ""
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) return

    event.preventDefault()
    router.push(`/intranet/web-view?url=${encodeURIComponent(href)}`)
  }

  if (isLikelyHtmlContent(content)) {
    return (
      <div
        className="rich-content"
        onClickCapture={handleHtmlClick}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }

  return (
    <div className="space-y-4 text-[var(--foreground)]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="leading-7 text-[var(--foreground)]">{children}</p>,
          h3: ({ children }) => <h3 className="pt-2 text-base font-semibold text-[var(--foreground)]">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc space-y-2 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-2 pl-5">{children}</ol>,
          li: ({ children }) => <li className="leading-7 text-[var(--foreground)]">{children}</li>,
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse overflow-hidden rounded-2xl border border-white/10 text-left text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead>{children}</thead>,
          tbody: ({ children }) => <tbody className="text-[var(--foreground-muted)]">{children}</tbody>,
          tr: ({ children }) => <tr className="bg-transparent">{children}</tr>,
          th: ({ children }) => <th className="border border-white/10 bg-white/8 px-4 py-3 font-semibold text-[var(--foreground)]">{children}</th>,
          td: ({ children }) => <td className="border border-white/10 px-4 py-3">{children}</td>,
          a: ({ href, children }) => {
            const targetHref = href ?? ""

            if (linkBehavior === "disabled") {
              return <span className="font-semibold text-[var(--accent-strong)] underline underline-offset-4">{children}</span>
            }

            return (
              <a
                href={targetHref}
                className="font-semibold text-[var(--accent-strong)] underline decoration-[1.5px] underline-offset-4 hover:opacity-90"
                onClick={(event) => {
                  if (!targetHref || linkBehavior !== "webview") return
                  if (targetHref.startsWith("mailto:") || targetHref.startsWith("tel:")) return

                  event.preventDefault()
                  router.push(`/intranet/web-view?url=${encodeURIComponent(targetHref)}`)
                }}
              >
                {children}
              </a>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

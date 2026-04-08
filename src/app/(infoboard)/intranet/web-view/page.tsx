import Link from "next/link"
import { ArrowLeft } from "lucide-react"

type WebViewPageProps = {
  searchParams?: Promise<{
    url?: string
  }>
}

function getSafeUrl(rawUrl?: string) {
  if (!rawUrl) return null

  try {
    const parsed = new URL(rawUrl)
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString()
    }
  } catch {
  }

  return null
}

function getTitle(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return "Webvisning"
  }
}

export default async function IntranetWebViewPage({ searchParams }: WebViewPageProps) {
  const params = await searchParams
  const safeUrl = getSafeUrl(params?.url)

  if (!safeUrl) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <div
          className="sticky top-0 z-20 shrink-0 px-4 py-3 md:px-6"
          style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--surface-border)" }}
        >
          <div className="flex items-center">
            <Link
              href="/intranet"
              className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: "var(--foreground)" }}
            >
              <ArrowLeft className="h-4 w-4" />
              Tilbage
            </Link>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-4">
          <p className="text-sm text-[var(--foreground-muted)]">Linket kunne ikke vises.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div
        className="sticky top-0 z-20 shrink-0 px-4 py-3 md:px-6"
        style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--surface-border)" }}
      >
        <div className="flex items-center">
          <Link
            href="/intranet"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: "var(--foreground)" }}
          >
            <ArrowLeft className="h-4 w-4" />
            Tilbage
          </Link>
        </div>
      </div>
      <div className="flex-1">
        <iframe
          src={safeUrl}
          title={getTitle(safeUrl)}
          className="h-[calc(100vh-3.8125rem)] w-full border-0"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  )
}

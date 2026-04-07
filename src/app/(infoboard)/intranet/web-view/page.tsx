import { SectionPageShell } from "@/components/SectionPageShell"

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
      <SectionPageShell title="Webvisning" subtitle="Ugyldigt link" backHref="/intranet" fullWidth>
        <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center px-4">
          <p className="text-sm text-[var(--foreground-muted)]">Linket kunne ikke vises.</p>
        </div>
      </SectionPageShell>
    )
  }

  return (
    <SectionPageShell title={getTitle(safeUrl)} subtitle={safeUrl} backHref="/intranet" fullWidth>
      <div className="h-[calc(100vh-10.5rem)] w-full overflow-hidden rounded-[1.25rem] border border-[color:var(--surface-border)] bg-[color:var(--surface)]">
        <iframe
          src={safeUrl}
          title={getTitle(safeUrl)}
          className="h-full w-full border-0"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </SectionPageShell>
  )
}

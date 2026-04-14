import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { ArrowLeft, Download } from "lucide-react"
import Link from "next/link"

import { db } from "@/db"
import { setting } from "@/db/schema"
import {
  INTRANET_DOCUMENTS_SETTING_KEY,
  normalizeIntranetDocuments,
} from "@/lib/intranet-documents"

interface Props {
  params: Promise<{ id: string }>
}

export default async function DokumentPage({ params }: Props) {
  const { id } = await params

  let doc = null
  try {
    const rows = await db
      .select()
      .from(setting)
      .where(eq(setting.key, INTRANET_DOCUMENTS_SETTING_KEY))
      .limit(1)

    if (rows.length) {
      const docs = normalizeIntranetDocuments(JSON.parse(rows[0].value))
      doc = docs.find((d) => d.id === id) ?? null
    }
  } catch {
    // fall through to notFound
  }

  if (!doc) notFound()

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Toolbar */}
      <div
        className="flex shrink-0 items-center justify-between gap-4 border-b px-4 py-3"
        style={{ borderColor: "var(--surface-border)", background: "var(--surface)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/intranet"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors hover:bg-muted/30"
            style={{ borderColor: "var(--surface-border)" }}
            aria-label="Tilbage til intranet"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span
            className="truncate text-sm font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {doc.title || doc.originalName}
          </span>
        </div>

        <a
          href={doc.url}
          download={doc.originalName}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/30"
          style={{ borderColor: "var(--surface-border)", color: "var(--foreground-muted)" }}
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </a>
      </div>

      {/* PDF embed */}
      <div className="flex-1 overflow-hidden">
        <iframe
          src={`${doc.url}#toolbar=1&navpanes=1`}
          title={doc.title || doc.originalName}
          className="h-full w-full border-0"
        />
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  try {
    const rows = await db
      .select()
      .from(setting)
      .where(eq(setting.key, INTRANET_DOCUMENTS_SETTING_KEY))
      .limit(1)

    if (rows.length) {
      const docs = normalizeIntranetDocuments(JSON.parse(rows[0].value))
      const doc = docs.find((d) => d.id === id)
      if (doc) return { title: doc.title || doc.originalName }
    }
  } catch {
    // ignore
  }
  return { title: "Dokument" }
}

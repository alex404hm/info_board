"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, Save } from "lucide-react"

import { IntranetMarkdownEditor } from "@/components/intranet/IntranetMarkdownEditor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { normalizeEditorContent } from "@/lib/intranet-content"
import { type IntranetFaqItem } from "@/lib/intranet-faq"

function normalizeItemsForEditor(items: IntranetFaqItem[]) {
  return items.map((item) => ({
    ...item,
    content: normalizeEditorContent(item.content),
  }))
}

export default function AdminIntranetFullEditorPage() {
  return (
    <Suspense>
      <AdminIntranetFullEditorContent />
    </Suspense>
  )
}

function AdminIntranetFullEditorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = searchParams.get("id") ?? ""

  const [items, setItems] = useState<IntranetFaqItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const selectedIndex = useMemo(() => items.findIndex((item) => item.id === id), [items, id])
  const selectedItem = selectedIndex >= 0 ? items[selectedIndex] : null

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const response = await fetch("/api/intranet-faq", { cache: "no-store" })
        if (!response.ok) throw new Error("load_failed")

        const data = (await response.json()) as IntranetFaqItem[]
        if (!mounted || !Array.isArray(data)) return

        setItems(normalizeItemsForEditor(data))
      } catch {
        if (!mounted) return
        setToast({ type: "error", text: "Kunne ikke hente intranet-FAQ." })
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(timeout)
  }, [toast])

  async function save() {
    if (!selectedItem) return
    setSaving(true)
    setToast(null)

    try {
      const response = await fetch("/api/intranet-faq", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
      })

      if (!response.ok) throw new Error("save_failed")
      setToast({ type: "success", text: "Ændringerne er gemt." })
    } catch {
      setToast({ type: "error", text: "Kunne ikke gemme ændringer." })
    } finally {
      setSaving(false)
    }
  }

  function updateSelected(patch: Partial<IntranetFaqItem>) {
    if (!selectedItem) return
    setItems((current) =>
      current.map((item) => (item.id === selectedItem.id ? { ...item, ...patch } : item))
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Fuld intranet-editor</p>
            <p className="text-xs text-muted-foreground">Brug denne side til fokuseret redigering i stor visning.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => router.push("/admin/intranet")}>Tilbage</Button>
            <Button type="button" onClick={() => void save()} disabled={saving || !selectedItem}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Gem ændringer
            </Button>
          </div>
        </div>
      </div>

      {toast ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${toast.type === "success" ? "admin-toast-success" : "admin-toast-error"}`}>
          {toast.text}
        </div>
      ) : null}

      <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Henter indhold...
          </div>
        ) : !selectedItem ? (
          <p className="text-sm text-muted-foreground">Kunne ikke finde det valgte FAQ-punkt.</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Titel</label>
              <Input
                value={selectedItem.title}
                onChange={(event) => updateSelected({ title: event.target.value })}
                placeholder="Titel på FAQ-punkt"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Indhold</label>
              <IntranetMarkdownEditor
                key={selectedItem.id}
                value={selectedItem.content}
                onChange={(next) => updateSelected({ content: next })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

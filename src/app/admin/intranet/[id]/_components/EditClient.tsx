"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api-fetch"
import { ArrowLeft, Loader2, Save } from "lucide-react"

import { IntranetMarkdownEditor } from "@/components/intranet/IntranetMarkdownEditor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useConfirmDialog } from "@/components/confirm-dialog-provider"
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard"
import { normalizeEditorContent } from "@/lib/intranet-content"
import { type IntranetFaqItem } from "@/lib/intranet-faq"

function createDraftItem(): IntranetFaqItem {
  return {
    id: crypto.randomUUID(),
    title: "Nyt FAQ-punkt",
    content: "<p>Skriv indhold her...</p>",
  }
}

export default function AdminIntranetEditPage() {
  const params = useParams()
  const router = useRouter()
  const confirm = useConfirmDialog()
  const id = params?.id as string
  const isNew = id === "new"

  const [allItems, setAllItems] = useState<IntranetFaqItem[]>([])
  const [item, setItem] = useState<IntranetFaqItem | null>(null)
  const [baseline, setBaseline] = useState<IntranetFaqItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const hasUnsavedChanges =
    item !== null && baseline !== null && JSON.stringify(item) !== JSON.stringify(baseline)

  async function goBack() {
    if (hasUnsavedChanges) {
      const ok = await confirm({
        title: "Forlad redigering?",
        description: "Hvis du forlader siden nu, mister du dine ændringer.",
        confirmText: "Forlad",
        cancelText: "Bliv her",
        tone: "warning",
      })
      if (!ok) return
    }
    router.push("/admin/intranet")
  }

  useUnsavedChangesGuard({
    enabled: hasUnsavedChanges,
    title: "Forlad redigering?",
    description: "Hvis du forlader siden nu, mister du dine ændringer.",
  })

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await apiFetch("/api/intranet-faq", { cache: "no-store" })
        if (!res.ok) throw new Error()
        const data = (await res.json()) as IntranetFaqItem[]
        if (!mounted) return

        if (isNew) {
          const draft = createDraftItem()
          const normalized = { ...draft, content: normalizeEditorContent(draft.content) }
          setAllItems(data)
          setItem(normalized)
          setBaseline({ ...normalized })
        } else {
          const found = data.find((i) => i.id === id)
          if (!found) {
            setNotFound(true)
          } else {
            const normalized = { ...found, content: normalizeEditorContent(found.content) }
            setAllItems(data)
            setItem(normalized)
            setBaseline({ ...normalized })
          }
        }
      } catch {
        if (mounted) setToast({ type: "error", text: "Kunne ikke hente FAQ-punkter." })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => {
      mounted = false
    }
  }, [id, isNew])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(t)
  }, [toast])

  async function save() {
    if (!item) return
    setSaving(true)
    setToast(null)
    try {
      const updatedItems = isNew
        ? [...allItems, item]
        : allItems.map((i) => (i.id === item.id ? item : i))

      const res = await apiFetch("/api/intranet-faq", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItems),
      })
      if (!res.ok) throw new Error()

      setAllItems(updatedItems)
      setBaseline({ ...item })
      setToast({ type: "success", text: isNew ? "FAQ-punkt oprettet." : "FAQ-punkt gemt." })

      if (isNew) {
        router.replace(`/admin/intranet/${item.id}`)
      }
    } catch {
      setToast({ type: "error", text: "Kunne ikke gemme FAQ-punkt." })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Henter...</span>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-sm font-medium text-foreground">FAQ-punkt ikke fundet</p>
        <Button variant="outline" onClick={() => router.push("/admin/intranet")}>
          <ArrowLeft className="h-4 w-4" />
          Tilbage til listen
        </Button>
      </div>
    )
  }

  if (!item) return null

  return (
    <div className="space-y-6 pb-24">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl animate-in slide-in-from-top-2 ${
            toast.type === "success" ? "admin-toast-success" : "admin-toast-error"
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => void goBack()}>
            <ArrowLeft className="h-4 w-4" />
            Tilbage
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {isNew ? "Nyt FAQ-punkt" : "Rediger FAQ-punkt"}
            </h1>
            {hasUnsavedChanges && (
              <p className="text-xs text-amber-400">Ikke-gemte ændringer</p>
            )}
          </div>
        </div>
        <Button onClick={() => void save()} disabled={saving || !item.title.trim()}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isNew ? "Opret punkt" : "Gem ændringer"}
        </Button>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-border/60 bg-card/60 shadow-sm">
        <div className="border-b border-border/40 px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Indhold</h2>
        </div>
        <div className="space-y-5 p-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Titel <span className="text-destructive">*</span>
            </label>
            <Input
              value={item.title}
              onChange={(e) =>
                setItem((prev) => (prev ? { ...prev, title: e.target.value } : prev))
              }
              placeholder="Titel på FAQ-punkt"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Indhold
            </label>
            <div className="h-[60svh] min-h-96">
              <IntranetMarkdownEditor
                key={item.id}
                value={item.content}
                onChange={(next) =>
                  setItem((prev) => (prev ? { ...prev, content: next } : prev))
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

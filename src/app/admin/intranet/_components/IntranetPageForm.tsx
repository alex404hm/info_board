"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  LoaderCircle,
  Save,
  Trash2,
} from "lucide-react"

import { TiptapEditor } from "@/components/tiptap-editor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  convertIntranetContentToMarkdown,
  normalizeIntranetEditorContent,
} from "@/lib/intranet-editor-content"

// form.content stores HTML (what Tiptap uses); markdown conversion happens only at API boundary

type IntranetPageRecord = {
  id: string
  key: string
  title: string
  subtitle: string | null
  icon: string
  iconColor: string
  iconBg: string
  bgFrom: string
  bgTo: string
  glowA: string
  glowB: string
  accentColor: string
  content: string
  order: number
  isDraft: boolean
}

const DEFAULT_FORM: IntranetPageRecord = {
  id: "",
  key: "",
  title: "",
  subtitle: "",
  icon: "BookOpen",
  iconColor: "#5f9dff",
  iconBg: "rgba(95,157,255,0.18)",
  bgFrom: "rgba(20,31,56,0.98)",
  bgTo: "rgba(10,16,30,0.98)",
  glowA: "rgba(95,157,255,0.18)",
  glowB: "rgba(95,157,255,0.08)",
  accentColor: "#5f9dff",
  content: "",
  order: 0,
  isDraft: true,
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function IntranetPageForm({ initialData }: { initialData?: IntranetPageRecord }) {
  const router = useRouter()
  const [pageId, setPageId] = useState(initialData?.id ?? "")
  const [form, setForm] = useState<IntranetPageRecord>(() => ({
    ...DEFAULT_FORM,
    ...initialData,
    // Store as HTML for the editor — markdown conversion happens only when sending to the API
    content: normalizeIntranetEditorContent(initialData?.content ?? ""),
  }))
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [autoSaveState, setAutoSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [deleteState, setDeleteState] = useState<"idle" | "deleting">("idle")
  const [keyTouched, setKeyTouched] = useState(Boolean(initialData?.key))
  const hasMountedRef = useRef(false)
  const lastAutoSavedSnapshotRef = useRef("")

  useEffect(() => {
    if (keyTouched) return

    setForm((current) => ({
      ...current,
      key: slugify(current.title),
    }))
  }, [keyTouched, form.title])

  function setField<K extends keyof IntranetPageRecord>(field: K, value: IntranetPageRecord[K]) {
    setForm((current) => ({ ...current, [field]: value }))
    setSaveState("idle")
    setAutoSaveState("idle")
  }

  const buildPayload = useCallback((overrides?: Partial<IntranetPageRecord>) => {
    const next = { ...form, ...overrides }

    return {
      ...next,
      icon: DEFAULT_FORM.icon,
      iconColor: DEFAULT_FORM.iconColor,
      iconBg: DEFAULT_FORM.iconBg,
      bgFrom: DEFAULT_FORM.bgFrom,
      bgTo: DEFAULT_FORM.bgTo,
      glowA: DEFAULT_FORM.glowA,
      glowB: DEFAULT_FORM.glowB,
      accentColor: DEFAULT_FORM.accentColor,
      // Convert HTML → markdown+MDX for storage
      content: convertIntranetContentToMarkdown(next.content),
      key: slugify(next.key || next.title),
      subtitle: next.subtitle || null,
    }
  }, [form])

  const hasContentToAutosave = useCallback(() => {
    const plainContent = form.content
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .trim()

    return Boolean(form.title.trim() || form.subtitle?.trim() || plainContent)
  }, [form.content, form.subtitle, form.title])

  const saveDraft = useCallback(async () => {
    const payload = buildPayload({ isDraft: true })

    const endpoint = pageId ? `/api/admin/intranet/${pageId}` : "/api/admin/intranet"
    const method = pageId ? "PATCH" : "POST"

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(data?.error ?? "Autosave failed")
    }

    if (!pageId && data?.id) {
      setPageId(data.id)
      router.replace(`/admin/intranet/${data.id}`)
    }
  }, [buildPayload, pageId, router])

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      lastAutoSavedSnapshotRef.current = JSON.stringify(buildPayload({ isDraft: true }))
      return
    }

    if (saveState === "saving" || deleteState === "deleting") return
    if (!hasContentToAutosave()) return

    const snapshot = JSON.stringify(buildPayload({ isDraft: true }))
    if (snapshot === lastAutoSavedSnapshotRef.current) return

    const timeout = window.setTimeout(async () => {
      setAutoSaveState("saving")

      try {
        await saveDraft()
        lastAutoSavedSnapshotRef.current = snapshot
        setForm((current) => (current.isDraft ? current : { ...current, isDraft: true }))
        setAutoSaveState("saved")
        router.refresh()
      } catch (error) {
        console.error(error)
        setAutoSaveState("error")
      }
    }, 500)

    return () => window.clearTimeout(timeout)
  }, [buildPayload, deleteState, form, hasContentToAutosave, pageId, router, saveDraft, saveState])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaveState("saving")

    const payload = buildPayload({ isDraft: false })

    const isNewPage = !pageId
    const endpoint = isNewPage ? "/api/admin/intranet" : `/api/admin/intranet/${pageId}`
    const method = isNewPage ? "POST" : "PATCH"

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? "Save failed")
      }

      if (isNewPage && data.id) {
        setPageId(data.id)
        router.replace(`/admin/intranet/${data.id}`)
      }

      const savedSnapshot = JSON.stringify({ ...payload, isDraft: true })
      lastAutoSavedSnapshotRef.current = savedSnapshot
      setForm((current) => ({ ...current, isDraft: false }))
      setAutoSaveState("saved")
      setSaveState("saved")

      router.refresh()
    } catch (error) {
      console.error(error)
      setSaveState("error")
    }
  }

  async function handleDelete() {
    if (!pageId) return
    if (!window.confirm(`Slet siden "${form.title || form.key}"?`)) return

    setDeleteState("deleting")

    try {
      const response = await fetch(`/api/admin/intranet/${pageId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? "Delete failed")
      }

      router.push("/admin/intranet")
      router.refresh()
    } catch (error) {
      console.error(error)
      setDeleteState("idle")
    }
  }

  const saveIndicator =
    deleteState === "deleting"
      ? "Sletter..."
      : saveState === "saving"
        ? "Offentliggør..."
        : saveState === "error" || autoSaveState === "error"
          ? "Kunne ikke gemme"
          : autoSaveState === "saving"
            ? "Gemmer..."
            : autoSaveState === "saved" || saveState === "saved"
              ? "Gemt"
              : "Klar"

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-10">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {initialData ? "Rediger intranet-side" : "Ny intranet-side"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Rediger siden direkte og se formateringen med det samme.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="min-w-20 text-right text-sm text-muted-foreground">
              {saveIndicator}
            </div>
            {initialData?.id ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteState === "deleting"}
              >
                <Trash2 />
                {deleteState === "deleting" ? "Sletter..." : "Slet"}
              </Button>
            ) : null}
            <Button type="submit" disabled={saveState === "saving" || deleteState === "deleting"}>
              {saveState === "saving" ? <LoaderCircle className="animate-spin" /> : <Save />}
              {saveState === "saving" ? "Offentliggør..." : "Offentliggør"}
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Titel</span>
            <Input
              value={form.title}
              onChange={(event) => setField("title", event.target.value)}
              placeholder="Personalehandbog"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Nogle / URL</span>
            <Input
              value={form.key}
              onChange={(event) => {
                setKeyTouched(true)
                setField("key", slugify(event.target.value))
              }}
              placeholder="personalehaandbog"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Rækkefølge</span>
            <Input
              type="number"
              value={form.order}
              onChange={(event) => setField("order", Number(event.target.value) || 0)}
            />
          </label>
        </div>

        <label className="mt-4 block space-y-2">
          <span className="text-sm font-medium text-foreground">Undertitel</span>
          <Input
            value={form.subtitle ?? ""}
            onChange={(event) => setField("subtitle", event.target.value)}
            placeholder="Kort beskrivelse under sidenavnet"
          />
        </label>
      </div>

      <section className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">Indhold</h3>
            <p className="text-sm text-muted-foreground">
              Skriv her. Siden gemmes automatisk, mens du arbejder.
            </p>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <TiptapEditor
            content={form.content}
            placeholder="Skriv indholdet her. Brug editorens toolbar eller skriv direkte i editoren."
            onChange={(value) => setField("content", value)}
          />

          <p className="text-xs text-muted-foreground">
            Billeder indsattes direkte i editoren. PDF-filer gemmes som links og vises stadig som
            embedded preview pa den offentlige intranet-side.
          </p>
        </div>
      </section>
    </form>
  )
}

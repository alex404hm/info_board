"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Save, ArrowLeft, Loader2, Info, Layout, Palette, Type, FileEdit, Check, Globe, Clock } from "lucide-react"
import Link from "next/link"
import * as LucideIcons from "lucide-react"
import { TiptapEditor } from "@/components/tiptap-editor"


function IconRenderer({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Info
  return <IconComponent className={className} style={style} />
}

interface IntranetPageData {
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
  updatedAt: Date
}

interface IntranetPageFormProps {
  initialData?: IntranetPageData
}

const TABS = [
  { id: "edit", Icon: Type, label: "Rediger" },
  { id: "preview", Icon: Layout, label: "Forhåndsvisning" },
  { id: "settings", Icon: Palette, label: "Design" },
] as const

const inputClass =
  "w-full rounded-lg border border-input bg-card px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none transition-colors"

const settingsInputClass =
  "w-full rounded-lg border border-input bg-card px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none transition-colors"

export default function IntranetPageForm({ initialData }: IntranetPageFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "settings">("edit")
  const [draftSaved, setDraftSaved] = useState(false)
  const [previewContent, setPreviewContent] = useState(initialData?.content || "")
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "pending" | "saving" | "saved">("idle")
  const editorContentRef = useRef<string>(initialData?.content || "")
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    subtitle: initialData?.subtitle || "",
    key: initialData?.key || "",
    icon: initialData?.icon || "Info",
    iconColor: initialData?.iconColor || "#60a5fa",
    iconBg: initialData?.iconBg || "rgba(96,165,250,0.22)",
    bgFrom: initialData?.bgFrom || "rgba(30,58,138,0.95)",
    bgTo: initialData?.bgTo || "rgba(15,23,42,0.99)",
    glowA: initialData?.glowA || "rgba(96,165,250,0.22)",
    glowB: initialData?.glowB || "rgba(59,130,246,0.12)",
    accentColor: initialData?.accentColor || "#60a5fa",
    content: initialData?.content || "",
    isDraft: initialData?.isDraft ?? true,
  })

  const formDataRef = useRef(formData)

  // Keep formDataRef in sync so auto-save always has the latest values
  useEffect(() => { formDataRef.current = formData }, [formData])

  const scheduleAutoSave = useCallback(() => {
    if (!initialData) return
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    setAutoSaveStatus("pending")
    autoSaveTimerRef.current = setTimeout(async () => {
      setAutoSaveStatus("saving")
      try {
        await fetch(`/api/admin/intranet/${initialData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formDataRef.current,
            content: editorContentRef.current,
            isDraft: true,
          }),
        })
        setFormData((prev) => ({ ...prev, isDraft: true }))
        setAutoSaveStatus("saved")
        setTimeout(() => setAutoSaveStatus("idle"), 3000)
      } catch {
        setAutoSaveStatus("idle")
      }
    }, 15000)
  }, [initialData])

  const handleTabChange = (tab: "edit" | "preview" | "settings") => {
    if (tab === "preview") {
      setPreviewContent(editorContentRef.current)
    }
    setActiveTab(tab)
  }

  const handleSaveDraft = async () => {
    setLoading(true)
    setError(null)
    try {
      const submitData = {
        ...formData,
        content: editorContentRef.current,
        isDraft: true,
      }
      const url = initialData
        ? `/api/admin/intranet/${initialData.id}`
        : "/api/admin/intranet"
      const res = await fetch(url, {
        method: initialData ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Kunne ikke gemme kladden")
      }
      if (!initialData) {
        const data = await res.json()
        router.replace(`/admin/intranet/${data.id}`)
        return
      }
      setFormData((prev) => ({ ...prev, isDraft: true }))
      setDraftSaved(true)
      setTimeout(() => setDraftSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Der skete en fejl")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const submitData = {
        ...formData,
        content: editorContentRef.current,
        isDraft: false,
      }

      const url = initialData
        ? `/api/admin/intranet/${initialData.id}`
        : "/api/admin/intranet"

      const res = await fetch(url, {
        method: initialData ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Kunne ikke gemme siden")
      }

      router.push("/admin/intranet")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Der skete en fejl")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 w-full max-w-none rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
    >
      {/* ── Sticky header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between sticky top-0 z-10 bg-card/95 backdrop-blur-md px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/intranet"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground leading-none">
                {initialData ? "Rediger side" : "Ny side"}
              </h2>
              {formData.isDraft && (
                <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-amber-100 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400">
                  Kladde
                </span>
              )}
            </div>
            {formData.title && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{formData.title}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Tab switcher */}
          {TABS.map(({ id, Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleTabChange(id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === id
                  ? "bg-secondary text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}

          {/* Auto-save indicator */}
          {initialData && autoSaveStatus !== "idle" && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground px-2">
              {autoSaveStatus === "saving" ? (
                <><Loader2 className="h-3 w-3 animate-spin" />Gemmer…</>
              ) : autoSaveStatus === "saved" ? (
                <><Check className="h-3 w-3 text-green-500" />Autogemt</>
              ) : (
                <><Clock className="h-3 w-3" />Ændringer ikke gemt</>
              )}
            </span>
          )}

          <div className="w-px h-5 bg-border mx-1.5" />

          {/* Save as draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 ${
              draftSaved
                ? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400"
                : "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {draftSaved ? (
              <Check className="h-4 w-4" />
            ) : loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileEdit className="h-4 w-4" />
            )}
            {draftSaved ? "Gemt!" : "Gem kladde"}
          </button>

          {/* Publish */}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : formData.isDraft ? <Globe className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {formData.isDraft ? "Udgiv" : "Gem"}
          </button>
        </div>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className="mx-6 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
          <Info className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Edit tab ──────────────────────────────────────────────────────── */}
      {activeTab === "edit" && (
        <div className="space-y-5 px-6 pb-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Titel <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => { setFormData({ ...formData, title: e.target.value }); scheduleAutoSave() }}
                className={inputClass}
                placeholder="F.eks. Befordring"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Key (URL) <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                className={inputClass}
                placeholder="F.eks. befordring"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Undertitel
            </label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => { setFormData({ ...formData, subtitle: e.target.value }); scheduleAutoSave() }}
              className={inputClass}
              placeholder="F.eks. Tilskud og refusionsskema"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Indhold
            </label>
            <TiptapEditor
              content={formData.content}
              onChange={(html) => {
                editorContentRef.current = html
                scheduleAutoSave()
              }}
            />
          </div>
        </div>
      )}

      {/* ── Preview tab ────────────────────────────────────────────────────── */}
      {activeTab === "preview" && (
        <div className="px-6 pb-8 space-y-5">
          {/* Draft notice */}
          {formData.isDraft && (
            <div className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/25 text-amber-700 dark:text-amber-400">
              <FileEdit className="h-4 w-4 shrink-0" />
              Dette er en kladde og er ikke synlig for brugerne endnu.
            </div>
          )}

          {/* Gradient hero — mirrors the actual page */}
          <div
            className="relative overflow-hidden rounded-2xl px-6 py-7"
            style={{ background: `linear-gradient(135deg, ${formData.bgFrom}, ${formData.bgTo})` }}
          >
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full blur-3xl"
              style={{ background: formData.glowA }}
            />
            <div
              className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full blur-2xl"
              style={{ background: formData.glowB }}
            />
            <div className="relative flex items-center gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  background: formData.iconBg,
                  border: "1px solid rgba(255,255,255,0.16)",
                  boxShadow: `0 0 24px ${formData.glowA}`,
                }}
              >
                <IconRenderer name={formData.icon} className="h-7 w-7" style={{ color: formData.iconColor }} />
              </div>
              <div>
                <p className="text-2xl font-black tracking-tight text-white">
                  {formData.title || "Titel"}
                </p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {formData.subtitle || ""}
                </p>
              </div>
            </div>
          </div>

          {/* Rendered content */}
          {previewContent ? (
            <div className="rich-content" dangerouslySetInnerHTML={{ __html: previewContent }} />
          ) : (
            <p className="text-sm text-muted-foreground italic">Ingen indhold endnu…</p>
          )}
        </div>
      )}

      {/* ── Settings tab ───────────────────────────────────────────────────── */}
      {activeTab === "settings" && (
        <div className="grid grid-cols-2 gap-8 px-6 pb-8">
          {/* Left column */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Ikon indstillinger</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Ikon navn (Lucide)
                  </label>
                  <div className="flex gap-2">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-secondary border border-border">
                      <IconRenderer name={formData.icon} className="h-4 w-4" style={{ color: formData.iconColor }} />
                    </div>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className={settingsInputClass.replace("w-full", "flex-1 min-w-0")}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Ikon farve
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.iconColor}
                      onChange={(e) => setFormData({ ...formData, iconColor: e.target.value })}
                      className="h-9 w-10 flex-shrink-0 rounded-lg border border-input bg-card p-1 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.iconColor}
                      onChange={(e) => setFormData({ ...formData, iconColor: e.target.value })}
                      className={settingsInputClass.replace("w-full", "flex-1 min-w-0")}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Baggrundsgradient</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Start farve
                  </label>
                  <input
                    type="text"
                    value={formData.bgFrom}
                    onChange={(e) => setFormData({ ...formData, bgFrom: e.target.value })}
                    className={settingsInputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Slut farve
                  </label>
                  <input
                    type="text"
                    value={formData.bgTo}
                    onChange={(e) => setFormData({ ...formData, bgTo: e.target.value })}
                    className={settingsInputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Glow & Accent</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Glow A
                  </label>
                  <input
                    type="text"
                    value={formData.glowA}
                    onChange={(e) => setFormData({ ...formData, glowA: e.target.value })}
                    className={settingsInputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Glow B
                  </label>
                  <input
                    type="text"
                    value={formData.glowB}
                    onChange={(e) => setFormData({ ...formData, glowB: e.target.value })}
                    className={settingsInputClass}
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Accent Farve
                  </label>
                  <input
                    type="text"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className={settingsInputClass}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}

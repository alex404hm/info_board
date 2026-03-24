"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Save, ArrowLeft, Loader2, Info, Layout, Palette, Type } from "lucide-react"
import Link from "next/link"
import * as LucideIcons from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { IntranetEditorClient } from "./IntranetEditorClient"


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
  updatedAt: Date
}

interface IntranetPageFormProps {
  initialData?: IntranetPageData
}

export default function IntranetPageForm({ initialData }: IntranetPageFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "settings">("edit")

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
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = initialData 
        ? `/api/admin/intranet/${initialData.id}` 
        : "/api/admin/intranet"
      
      const res = await fetch(url, {
        method: initialData ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto p-6 bg-background/80 rounded-2xl shadow-xl border border-border/40">
      <div className="flex items-center justify-between sticky top-0 z-10 bg-background/90 backdrop-blur-md py-6 -mt-6 border-b border-border/40 rounded-t-2xl">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/intranet"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-surface-soft text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h2 className="text-xl font-bold">{initialData ? "Rediger side" : "Ny side"}</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeTab === "edit" ? "bg-accent/10 text-accent border border-accent/20" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Type className="h-3.5 w-3.5 inline mr-1.5" /> Rediger
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeTab === "preview" ? "bg-accent/10 text-accent border border-accent/20" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Layout className="h-3.5 w-3.5 inline mr-1.5" /> Forhåndsvisning
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeTab === "settings" ? "bg-accent/10 text-accent border border-accent/20" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Palette className="h-3.5 w-3.5 inline mr-1.5" /> Design
          </button>
          <div className="w-px h-4 bg-border/60 mx-1" />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Gem
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
          <Info className="h-4 w-4" />
          {error}
        </div>
      )}

      {activeTab === "edit" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Titel</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-lg border border-border/60 bg-surface px-4 py-2 focus:border-accent/40 focus:outline-none"
                placeholder="F.eks. Befordring"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Key (URL)</label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                className="w-full rounded-lg border border-border/60 bg-surface px-4 py-2 focus:border-accent/40 focus:outline-none"
                placeholder="F.eks. befordring"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Undertitel</label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full rounded-lg border border-border/60 bg-surface px-4 py-2 focus:border-accent/40 focus:outline-none"
              placeholder="F.eks. Tilskud og refusionsskema"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Indhold (Markdown)</label>
              <span className="text-[10px] text-muted-foreground">Markdown understøttes (overskrifter, lister, tabeller)</span>
            </div>
            {/* Shadcn Editor-X integration */}
            <div className="w-full min-h-[420px] rounded-2xl border border-border/60 bg-surface-soft shadow-lg p-2">
              <IntranetEditorClient
                content={formData.content}
                onSerializedChange={undefined}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "preview" && (
        <div className="rounded-2xl border border-border/60 bg-surface-soft p-10 max-w-3xl mx-auto prose prose-invert prose-base shadow-lg overflow-auto max-h-[70vh]">
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold mb-2">{formData.title || "Titel"}</h1>
            <p className="text-lg text-muted-foreground">{formData.subtitle || "Undertitel"}</p>
          </div>
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{formData.content || "*Ingen tekst endnu*"}</ReactMarkdown>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold">Ikon indstillinger</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ikon navn (Lucide)</label>
                  <div className="flex gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-soft border border-border/60">
                      <IconRenderer name={formData.icon} className="h-4 w-4" style={{ color: formData.iconColor }} />
                    </div>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="flex-1 rounded-lg border border-border/60 bg-surface px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ikon farve</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.iconColor}
                      onChange={(e) => setFormData({ ...formData, iconColor: e.target.value })}
                      className="h-9 w-12 rounded bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={formData.iconColor}
                      onChange={(e) => setFormData({ ...formData, iconColor: e.target.value })}
                      className="flex-1 rounded-lg border border-border/60 bg-surface px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold">Baggrundsgradient</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Start farve</label>
                  <input
                    type="text"
                    value={formData.bgFrom}
                    onChange={(e) => setFormData({ ...formData, bgFrom: e.target.value })}
                    className="w-full rounded-lg border border-border/60 bg-surface px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Slut farve</label>
                  <input
                    type="text"
                    value={formData.bgTo}
                    onChange={(e) => setFormData({ ...formData, bgTo: e.target.value })}
                    className="w-full rounded-lg border border-border/60 bg-surface px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="space-y-4">
              <h3 className="text-sm font-bold">Glow & Accent</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Glow A</label>
                  <input
                    type="text"
                    value={formData.glowA}
                    onChange={(e) => setFormData({ ...formData, glowA: e.target.value })}
                    className="w-full rounded-lg border border-border/60 bg-surface px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Glow B</label>
                  <input
                    type="text"
                    value={formData.glowB}
                    onChange={(e) => setFormData({ ...formData, glowB: e.target.value })}
                    className="w-full rounded-lg border border-border/60 bg-surface px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Accent Farve</label>
                  <input
                    type="text"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="w-full rounded-lg border border-border/60 bg-surface px-3 py-1.5 text-sm"
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

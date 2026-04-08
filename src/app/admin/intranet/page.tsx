"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ExternalLink,
  GripVertical,
  Loader2,
  Save,
  Search,
  Trash2,
} from "lucide-react"

import { AdminCreateButton } from "@/app/admin/_components/AdminCreateButton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard"
import { normalizeEditorContent, stripIntranetContent } from "@/lib/intranet-content"
import { DEFAULT_INTRANET_FAQ_ITEMS, type IntranetFaqItem } from "@/lib/intranet-faq"

function cloneItems(items: IntranetFaqItem[]) {
  return items.map((item) => ({ ...item }))
}

function normalizeItemsForEditor(items: IntranetFaqItem[]) {
  return cloneItems(items).map((item) => ({
    ...item,
    content: normalizeEditorContent(item.content),
  }))
}

function areItemsEqual(a: IntranetFaqItem[], b: IntranetFaqItem[]) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function createDraftItem(): IntranetFaqItem {
  return {
    id: crypto.randomUUID(),
    title: "Nyt FAQ-punkt",
    content: "<p>Skriv indhold her...</p>",
  }
}

export default function AdminIntranetPage() {
  const [items, setItems] = useState<IntranetFaqItem[]>(normalizeItemsForEditor(DEFAULT_INTRANET_FAQ_ITEMS))
  const [baselineItems, setBaselineItems] = useState<IntranetFaqItem[]>(normalizeItemsForEditor(DEFAULT_INTRANET_FAQ_ITEMS))
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_INTRANET_FAQ_ITEMS[0]?.id ?? "")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState("")
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? items[0] ?? null,
    [items, selectedId]
  )

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return items

    return items.filter((item) => {
      return (
        item.title.toLowerCase().includes(normalized) ||
        stripIntranetContent(item.content).toLowerCase().includes(normalized)
      )
    })
  }, [items, query])

  const hasUnsavedChanges = !areItemsEqual(items, baselineItems)

  useUnsavedChangesGuard({
    enabled: hasUnsavedChanges,
    title: "Forlade intranet-redigering?",
    description: "Hvis du forlader siden nu, mister du dine ændringer på intranetsiden.",
    confirmText: "Forlad",
    cancelText: "Bliv her",
  })

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const response = await fetch("/api/intranet-faq", { cache: "no-store" })
        if (!response.ok) throw new Error("load_failed")

        const data = (await response.json()) as IntranetFaqItem[]
        if (!mounted || !Array.isArray(data) || !data.length) return

        const normalizedItems = normalizeItemsForEditor(data)

        setItems(normalizedItems)
        setBaselineItems(normalizedItems)
        setSelectedId(data[0].id)
      } catch {
        if (!mounted) return
        setToast({
          type: "error",
          text: "Kunne ikke hente intranetindhold. Standardindholdet vises i editoren.",
        })
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

  function addItem() {
    const newItem = createDraftItem()
    setItems((current) => [...current, newItem])
    setSelectedId(newItem.id)
  }

  function deleteItem(id: string) {
    const next = items.filter((item) => item.id !== id)
    setItems(next)

    if (selectedId === id) {
      setSelectedId(next[0]?.id ?? "")
    }
  }

  function moveItemToIndex(id: string, targetIndex: number) {
    setItems((current) => {
      const index = current.findIndex((item) => item.id === id)
      if (index < 0 || targetIndex < 0 || targetIndex >= current.length || index === targetIndex) {
        return current
      }

      const next = [...current]
      const [moved] = next.splice(index, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
    setSelectedId(id)
  }

  async function saveItems() {
    setSaving(true)
    setToast(null)

    try {
      const response = await fetch("/api/intranet-faq", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
      })

      if (!response.ok) throw new Error("save_failed")

      const result = (await response.json()) as { items?: IntranetFaqItem[] }
      const savedItems = Array.isArray(result.items) && result.items.length ? result.items : items
      const normalizedSavedItems = normalizeItemsForEditor(savedItems)

      setItems(normalizedSavedItems)
      setBaselineItems(normalizedSavedItems)
      setToast({ type: "success", text: "Intranet-FAQ blev gemt." })
    } catch {
      setToast({ type: "error", text: "Kunne ikke gemme intranet-FAQ. Prøv igen." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-[calc(100svh-10rem)] min-h-0 flex-col gap-4">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-linear-to-br from-background via-card to-muted/30 p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">Intranet FAQ</p>
              <span className="rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur">
                {items.length} punkter
              </span>
              {hasUnsavedChanges && (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
                  Ikke gemt endnu
                </span>
              )}
            </div>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Moderne overblik med fast arbejdsområde. Indhold redigeres i den fulde editor.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <AdminCreateButton type="button" variant="outline" onClick={addItem}>
              Tilføj punkt
            </AdminCreateButton>
            <Button type="button" onClick={() => void saveItems()} disabled={saving || !items.length}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Gem ændringer
            </Button>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${toast.type === "success" ? "admin-toast-success" : "admin-toast-error"}`}>
          {toast.text}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col rounded-3xl border border-border/60 bg-card/95 p-4 shadow-sm backdrop-blur">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">FAQ-punkter</p>
            <p className="text-xs text-muted-foreground">Træk og slip for at ændre rækkefølgen. Åbn derefter i fuld editor.</p>
          </div>
          <span className="rounded-full border border-border/60 px-2 py-0.5 text-xs text-muted-foreground">{filteredItems.length} vist</span>
        </div>

        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Søg i titel og indhold"
            className="h-10 rounded-xl border-border/60 bg-background/80 pl-9"
          />
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-3 pr-4">
            {filteredItems.map((item) => {
              const selected = item.id === selectedItem?.id
              const absoluteIndex = items.findIndex((current) => current.id === item.id)

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                aria-pressed={selected}
                draggable
                onDragStart={(event) => {
                  setDraggedId(item.id)
                  event.dataTransfer.effectAllowed = "move"
                  event.dataTransfer.setData("text/plain", item.id)
                }}
                onDragOver={(event) => {
                  event.preventDefault()
                  event.dataTransfer.dropEffect = "move"
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  const sourceId = draggedId ?? event.dataTransfer.getData("text/plain")
                  if (!sourceId || sourceId === item.id) return
                  moveItemToIndex(sourceId, absoluteIndex)
                  setDraggedId(null)
                }}
                onDragEnd={() => setDraggedId(null)}
                onClick={() => setSelectedId(item.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    setSelectedId(item.id)
                  }
                }}
                className={`w-full rounded-2xl border p-4 text-left transition-all duration-200 ${
                  selected
                    ? "border-(--accent-strong) bg-(--accent-soft) shadow-sm"
                    : "border-border/60 bg-background hover:-translate-y-0.5 hover:border-(--accent-strong)/40 hover:bg-muted/40"
                } ${draggedId === item.id ? "opacity-60" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className="cursor-grab rounded-xl border border-border/60 bg-background/70 p-2 text-muted-foreground active:cursor-grabbing">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                      <span className="rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-[11px] text-muted-foreground">
                        #{absoluteIndex + 1}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                      {stripIntranetContent(item.content).slice(0, 150) || "Intet indhold endnu"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <p className="text-[11px] text-muted-foreground">Træk og slip for at flytte punktet</p>
                  <Button type="button" size="sm" variant="secondary" asChild className="ml-auto rounded-lg">
                    <a
                      href={`/admin/intranet/full-editor?id=${encodeURIComponent(item.id)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Åbn editor
                    </a>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-lg text-red-600 hover:text-red-700"
                    onClick={(event) => {
                      event.stopPropagation()
                      deleteItem(item.id)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}

          {!filteredItems.length && (
            <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Ingen punkter matcher din søgning.
            </div>
          )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Edit2,
  GripVertical,
  Loader2,
  Save,
  Search,
  Trash2,
} from "lucide-react"

import { IntranetMarkdownEditor } from "@/components/intranet/IntranetMarkdownEditor"
import { AdminCreateButton } from "@/app/admin/_components/AdminCreateButton"
import { useConfirmDialog } from "@/components/confirm-dialog-provider"
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
  const confirmDialog = useConfirmDialog()
  const [items, setItems] = useState<IntranetFaqItem[]>(normalizeItemsForEditor(DEFAULT_INTRANET_FAQ_ITEMS))
  const [baselineItems, setBaselineItems] = useState<IntranetFaqItem[]>(normalizeItemsForEditor(DEFAULT_INTRANET_FAQ_ITEMS))
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_INTRANET_FAQ_ITEMS[0]?.id ?? "")
  const [showEditor, setShowEditor] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState("")
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const mobileEditorRef = useRef<HTMLDivElement | null>(null)

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

  useEffect(() => {
    if (!selectedItem) {
      setShowEditor(false)
    }
  }, [selectedItem])

  function addItem() {
    const newItem = createDraftItem()
    setItems((current) => [...current, newItem])
    setSelectedId(newItem.id)
    setShowEditor(true)
  }

  function deleteItem(id: string) {
    const next = items.filter((item) => item.id !== id)
    setItems(next)

    if (selectedId === id) {
      setSelectedId(next[0]?.id ?? "")
      if (!next.length) {
        setShowEditor(false)
      }
    }
  }

  function startEditing(id: string) {
    setSelectedId(id)
    setShowEditor(true)

    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      window.setTimeout(() => {
        mobileEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 80)
    }
  }

  async function requestDeleteItem(id: string) {
    const item = items.find((entry) => entry.id === id)
    if (!item) return

    const shouldDelete = await confirmDialog({
      title: "Slet FAQ-punkt?",
      description: `Er du sikker på, at du vil slette \"${item.title || "Uden titel"}\"? Handlingen kan ikke fortrydes.`,
      confirmText: "Slet",
      cancelText: "Annuller",
      tone: "danger",
    })

    if (!shouldDelete) return

    deleteItem(id)
    setToast({ type: "success", text: "FAQ-punkt slettet. Husk at gemme ændringer." })
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

  function updateSelected(patch: Partial<IntranetFaqItem>) {
    if (!selectedItem) return
    setItems((current) =>
      current.map((item) => (item.id === selectedItem.id ? { ...item, ...patch } : item))
    )
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
    <div className="flex h-[calc(100svh-10rem)] min-h-0 flex-col lg:flex-row lg:gap-4 gap-0">
      {/* Left panel: List of items */}
      <div className="flex min-w-0 flex-1 flex-col lg:flex-1">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-linear-to-br from-background via-card to-muted/30 p-6 shadow-sm">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">FAQ-punkter</p>
                <span className="rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur">
                  {items.length} punkter
                </span>
                {hasUnsavedChanges && (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
                    Ikke gemt
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {showEditor && selectedItem ? (
                <Button type="button" size="sm" variant="outline" onClick={() => setShowEditor(false)}>
                  Luk editor
                </Button>
              ) : null}
              <AdminCreateButton type="button" variant="outline" size="sm" onClick={addItem}>
                Tilføj punkt
              </AdminCreateButton>
              <Button type="button" size="sm" onClick={() => void saveItems()} disabled={saving || !items.length}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Gem
              </Button>
            </div>
          </div>
        </div>

        {toast && (
          <div className={`rounded-2xl border px-4 py-3 text-sm ${toast.type === "success" ? "admin-toast-success" : "admin-toast-error"}`}>
            {toast.text}
          </div>
        )}

        {/* List container */}
        <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-3xl border border-border/60 bg-card/95 p-4 shadow-sm backdrop-blur">
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-2">Søg og drag for at organisere</p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Søg i titel..."
                className="h-10 rounded-xl border-border/60 bg-background/80 pl-9 text-sm"
              />
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-2 pr-4">
              {loading ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-border/40 bg-background/40 px-4 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Henter FAQ-punkter...
                </div>
              ) : filteredItems.map((item) => {
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
                    onDoubleClick={() => startEditing(item.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        setSelectedId(item.id)
                      }
                    }}
                    className={`group w-full rounded-xl border p-3 text-left transition-all duration-200 ${
                      selected
                        ? "border-blue-500/50 bg-blue-500/10 shadow-sm"
                        : "border-border/40 bg-background/50 hover:border-border/60 hover:bg-muted/50"
                    } ${draggedId === item.id ? "opacity-50" : ""} cursor-pointer`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="mt-0.5 cursor-grab rounded-lg border border-border/60 bg-muted/30 p-1.5 text-muted-foreground active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{item.title || "Uden titel"}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                          {stripIntranetContent(item.content).slice(0, 80) || "Intet indhold"}
                        </p>
                      </div>
                      <span className="mt-0.5 shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        #{absoluteIndex + 1}
                      </span>
                      <div className="ml-1 flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={(event) => {
                            event.stopPropagation()
                            startEditing(item.id)
                          }}
                          title="Rediger"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={(event) => {
                            event.stopPropagation()
                            void requestDeleteItem(item.id)
                          }}
                          title="Slet"
                          className="hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {!filteredItems.length && (
                <div className="rounded-2xl border border-dashed border-border/40 px-4 py-8 text-center text-sm text-muted-foreground">
                  Ingen punkter matcher søgningen
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Right panel: Editor (Desktop) */}
      {showEditor && selectedItem ? (
        <div className="hidden lg:flex min-w-0 w-2/5 flex-col rounded-3xl border border-border/60 bg-card/95 shadow-sm backdrop-blur overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/40 px-6 py-4 shrink-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">Rediger: {selectedItem.title}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowEditor(false)}>
                Luk
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void requestDeleteItem(selectedItem.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-4 p-6">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Titel
                </label>
                <Input
                  value={selectedItem.title}
                  onChange={(event) => updateSelected({ title: event.target.value })}
                  placeholder="Titel på FAQ-punkt"
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2 flex-1 min-h-0">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Indhold
                </label>
                <div className="h-96">
                  <IntranetMarkdownEditor
                    key={selectedItem.id}
                    value={selectedItem.content}
                    onChange={(next) => updateSelected({ content: next })}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      ) : null}

      {!showEditor && selectedItem ? (
        <div className="hidden lg:flex min-w-0 w-2/5 flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
          <p className="text-sm font-medium text-foreground">Redigering i samme side</p>
          <p className="mt-1 text-xs text-muted-foreground">Klik på Rediger ud for et FAQ-punkt for at åbne editoren her.</p>
          <Button type="button" size="sm" className="mt-4" onClick={() => startEditing(selectedItem.id)}>
            <Edit2 className="h-4 w-4" />
            Rediger valgt punkt
          </Button>
        </div>
      ) : null}

      {/* Mobile Editor */}
      {showEditor && selectedItem ? (
        <div ref={mobileEditorRef} className="lg:hidden mt-4 flex flex-col rounded-3xl border border-border/60 bg-card/95 shadow-sm backdrop-blur overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/40 px-4 py-3 shrink-0">
            <p className="text-sm font-semibold text-foreground truncate">{selectedItem.title}</p>
            <div className="flex items-center gap-1">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowEditor(false)}>
                Luk
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void requestDeleteItem(selectedItem.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="min-h-0 max-h-[70svh] flex-1">
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Titel</label>
                <Input
                  value={selectedItem.title}
                  onChange={(event) => updateSelected({ title: event.target.value })}
                  placeholder="Titel"
                  className="rounded-lg text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Indhold</label>
                <div className="h-[52svh] min-h-80">
                  <IntranetMarkdownEditor
                    key={selectedItem.id}
                    value={selectedItem.content}
                    onChange={(next) => updateSelected({ content: next })}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      ) : null}
    </div>
  )
}

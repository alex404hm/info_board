"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api-fetch"
import { Edit2, FileText, GripVertical, Loader2, Search, Trash2 } from "lucide-react"

import { AdminCreateButton } from "@/components/admin/AdminCreateButton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { stripIntranetContent } from "@/lib/intranet-content"
import { DEFAULT_INTRANET_FAQ_ITEMS, type IntranetFaqItem } from "@/lib/intranet-faq"

export default function AdminIntranetPage() {
  const router = useRouter()
  const [items, setItems] = useState<IntranetFaqItem[]>(DEFAULT_INTRANET_FAQ_ITEMS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteItem, setDeleteItem] = useState<IntranetFaqItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        stripIntranetContent(item.content).toLowerCase().includes(q),
    )
  }, [items, query])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await apiFetch("/api/intranet-faq", { cache: "no-store" })
        if (!res.ok) throw new Error()
        const data = (await res.json()) as IntranetFaqItem[]
        if (mounted && Array.isArray(data) && data.length) setItems(data)
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
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(t)
  }, [toast])

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
  }

  async function saveOrder() {
    setSaving(true)
    setToast(null)
    try {
      const res = await apiFetch("/api/intranet-faq", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
      })
      if (!res.ok) throw new Error()
      setToast({ type: "success", text: "Rækkefølge gemt." })
    } catch {
      setToast({ type: "error", text: "Kunne ikke gemme rækkefølge." })
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteItem) return
    const id = deleteItem.id
    setDeletingId(id)
    try {
      const next = items.filter((item) => item.id !== id)
      const res = await apiFetch("/api/intranet-faq", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      })
      if (!res.ok) throw new Error()
      setItems(next)
      setDeleteItem(null)
      setToast({ type: "success", text: "FAQ-punkt slettet." })
    } catch {
      setToast({ type: "error", text: "Kunne ikke slette FAQ-punkt." })
    } finally {
      setDeletingId(null)
    }
  }

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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Intranet FAQ</h1>
            <p className="text-xs text-muted-foreground">Administrer FAQ-punkter til intranetsiden</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void saveOrder()}
            disabled={saving || loading}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Gem rækkefølge
          </Button>
          <AdminCreateButton onClick={() => router.push("/admin/intranet/new")}>
            Tilføj punkt
          </AdminCreateButton>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Søg i titel eller indhold..."
          className="pl-9"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex h-32 items-center justify-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Henter FAQ-punkter…</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/40 bg-muted/10 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/30 text-muted-foreground">
            <FileText className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Ingen FAQ-punkter endnu</p>
          <p className="text-xs text-muted-foreground/60">
            Klik på &ldquo;Tilføj punkt&rdquo; for at oprette det første
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  {["", "#", "Titel", "Indhold", ""].map((h, i) => (
                    <th
                      key={i}
                      className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredItems.map((item) => {
                  const absoluteIndex = items.findIndex((i) => i.id === item.id)
                  return (
                    <tr
                      key={item.id}
                      className={`group transition-colors hover:bg-muted/20 ${draggedId === item.id ? "opacity-50" : ""}`}
                      draggable
                      onDragStart={(e) => {
                        setDraggedId(item.id)
                        e.dataTransfer.effectAllowed = "move"
                        e.dataTransfer.setData("text/plain", item.id)
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.dataTransfer.dropEffect = "move"
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        const sourceId = draggedId ?? e.dataTransfer.getData("text/plain")
                        if (!sourceId || sourceId === item.id) return
                        moveItemToIndex(sourceId, absoluteIndex)
                        setDraggedId(null)
                      }}
                      onDragEnd={() => setDraggedId(null)}
                    >
                      <td className="w-10 pl-3 pr-0 py-4">
                        <div className="cursor-grab rounded-lg border border-border/60 bg-muted/30 p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
                          <GripVertical className="h-3.5 w-3.5" />
                        </div>
                      </td>
                      <td className="px-5 py-4 tabular-nums text-xs text-muted-foreground">
                        {absoluteIndex + 1}
                      </td>
                      <td className="max-w-[200px] px-5 py-4 font-medium text-foreground">
                        <span className="block truncate">{item.title || "Uden titel"}</span>
                      </td>
                      <td className="max-w-[400px] px-5 py-4">
                        <span className="line-clamp-1 text-xs text-muted-foreground">
                          {stripIntranetContent(item.content).slice(0, 120) || "Intet indhold"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => router.push(`/admin/intranet/${item.id}`)}
                            title="Rediger"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleteItem(item)}
                            title="Slet"
                            className="hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredItems.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              Ingen punkter matcher søgningen
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader className="text-center">
            <AlertDialogMedia className="mx-auto bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </AlertDialogMedia>
            <AlertDialogTitle>Slet FAQ-punkt?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på, at du vil slette{" "}
              <strong className="font-semibold text-foreground">{deleteItem?.title}</strong>?
              Handlingen kan ikke fortrydes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Annuller</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={!!deletingId}
              onClick={() => {
                void confirmDelete()
              }}
            >
              {deletingId ? "Sletter..." : "Slet"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

"use client"

import { useCallback, useRef, useState } from "react"
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react"
import { ExternalLink, FileText, GripHorizontal, Trash2 } from "lucide-react"

const MIN_HEIGHT = 200
const MAX_HEIGHT = 1200
const DEFAULT_HEIGHT = 480

export function PdfBlockNodeComponent({ node, deleteNode, selected, updateAttributes }: NodeViewProps) {
  const { src, title } = node.attrs as { src: string; title: string; height?: number }
  const label = title || (src as string)?.split("/").pop() || "Dokument"
  const [height, setHeight] = useState<number>((node.attrs.height as number) ?? DEFAULT_HEIGHT)
  const isResizingRef = useRef(false)

  const startHeightResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const startY = e.clientY
      const startHeight = height
      isResizingRef.current = true

      const onMove = (moveEvent: MouseEvent) => {
        const next = Math.round(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, startHeight + moveEvent.clientY - startY)))
        setHeight(next)
      }

      const onUp = () => {
        isResizingRef.current = false
        document.removeEventListener("mousemove", onMove)
        document.removeEventListener("mouseup", onUp)
        // Persist to node attrs so it's serialized
        setHeight((h) => {
          updateAttributes({ height: h })
          return h
        })
      }

      document.addEventListener("mousemove", onMove)
      document.addEventListener("mouseup", onUp)
    },
    [height, updateAttributes]
  )

  if (!src) return null

  return (
    <NodeViewWrapper
      data-drag-handle
      className={[
        "pdf-block-node my-4 rounded-xl border overflow-hidden bg-card shadow-sm transition-shadow select-none",
        selected ? "border-primary ring-2 ring-primary/30" : "border-border",
      ].join(" ")}
      contentEditable={false}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex-shrink-0 rounded-lg bg-primary/10 p-2 text-primary">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">PDF dokument · {height}px</p>
        </div>
        <div className="flex items-center gap-1">
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            Åbn
          </a>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              deleteNode()
            }}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="Fjern PDF"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* PDF iframe */}
      <div className="bg-muted/10">
        <iframe
          src={`${src}#toolbar=0&navpanes=0&scrollbar=1`}
          title={label}
          className="w-full"
          style={{ height, border: "none", display: "block" }}
        />
      </div>

      {/* Resize handle */}
      <div
        className="flex items-center justify-center h-5 bg-muted/20 border-t border-border cursor-ns-resize hover:bg-muted/40 transition-colors group"
        onMouseDown={startHeightResize}
        title="Træk for at ændre højde"
      >
        <GripHorizontal className="h-3 w-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
      </div>
    </NodeViewWrapper>
  )
}

"use client"

import { useCallback, useRef, useState } from "react"
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react"

export function ResizableImageNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const width: number | null = node.attrs.width ?? null

  const startResize = useCallback(
    (e: React.MouseEvent, side: "left" | "right") => {
      e.preventDefault()
      e.stopPropagation()

      const startX = e.clientX
      const startWidth = containerRef.current?.offsetWidth ?? 300

      setIsResizing(true)

      const onMove = (moveEvent: MouseEvent) => {
        const delta =
          side === "right" ? moveEvent.clientX - startX : startX - moveEvent.clientX
        const next = Math.round(Math.max(80, startWidth + delta))
        updateAttributes({ width: next })
      }

      const onUp = () => {
        setIsResizing(false)
        document.removeEventListener("mousemove", onMove)
        document.removeEventListener("mouseup", onUp)
      }

      document.addEventListener("mousemove", onMove)
      document.addEventListener("mouseup", onUp)
    },
    [updateAttributes]
  )

  const handleStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 10,
    height: 48,
    borderRadius: 5,
    background: "hsl(var(--primary, 221 83% 53%))",
    cursor: "ew-resize",
    opacity: 0.9,
    zIndex: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
  }

  return (
    <NodeViewWrapper
      style={{ display: "inline-block", maxWidth: "100%", verticalAlign: "top" }}
    >
      <div
        ref={containerRef}
        data-drag-handle
        style={{
          position: "relative",
          display: "inline-block",
          width: width ? `${width}px` : "auto",
          maxWidth: "100%",
          cursor: isResizing ? "ew-resize" : "default",
          outline: selected ? "2px solid hsl(221 83% 53%)" : "none",
          outlineOffset: 2,
          borderRadius: 8,
          userSelect: "none",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={node.attrs.src as string}
          alt={(node.attrs.alt as string) ?? ""}
          title={(node.attrs.title as string) ?? undefined}
          draggable={false}
          style={{ display: "block", width: "100%", borderRadius: 8 }}
        />

        {selected && (
          <>
            {/* Left handle */}
            <div
              style={{ ...handleStyle, left: -5 }}
              onMouseDown={(e) => startResize(e, "left")}
            />
            {/* Right handle */}
            <div
              style={{ ...handleStyle, right: -5 }}
              onMouseDown={(e) => startResize(e, "right")}
            />
          </>
        )}

        {selected && width && (
          <div
            style={{
              position: "absolute",
              bottom: 6,
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.65)",
              color: "#fff",
              fontSize: 11,
              borderRadius: 4,
              padding: "1px 6px",
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            {width}px
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

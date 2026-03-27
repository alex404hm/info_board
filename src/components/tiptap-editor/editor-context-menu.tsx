"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import type { Editor } from "@tiptap/react"
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
  Trash2,
  Type,
} from "lucide-react"

interface MenuItem {
  label: string
  icon: React.ReactNode
  action: () => void
  active?: boolean
  separator?: never
}
interface Separator {
  separator: true
  label?: never
  icon?: never
  action?: never
  active?: never
}
type MenuEntry = MenuItem | Separator

interface ContextMenuState {
  x: number
  y: number
}

export function EditorContextMenu({ editor }: { editor: Editor | null }) {
  const [menu, setMenu] = useState<ContextMenuState | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editor) return

    const dom = editor.view.dom

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      // Adjust position so menu stays inside viewport
      const x = Math.min(e.clientX, window.innerWidth - 220)
      const y = Math.min(e.clientY, window.innerHeight - 320)
      setMenu({ x, y })
    }

    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null)
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null)
    }

    dom.addEventListener("contextmenu", onContextMenu)
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      dom.removeEventListener("contextmenu", onContextMenu)
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [editor])

  if (!menu || !editor) return null

  const close = () => setMenu(null)
  const run = (fn: () => boolean | void) => { fn(); close() }

  const isNodeActive = editor.isActive("pdfBlock") || editor.isActive("image")
  const hasSelection = !editor.state.selection.empty

  const items: MenuEntry[] = isNodeActive
    ? [
        {
          label: "Slet element",
          icon: <Trash2 className="h-3.5 w-3.5" />,
          action: () => run(() => editor.chain().focus().deleteSelection().run()),
        },
      ]
    : [
        ...(hasSelection
          ? [
              {
                label: "Fed",
                icon: <Bold className="h-3.5 w-3.5" />,
                active: editor.isActive("bold"),
                action: () => run(() => editor.chain().focus().toggleBold().run()),
              } as MenuItem,
              {
                label: "Kursiv",
                icon: <Italic className="h-3.5 w-3.5" />,
                active: editor.isActive("italic"),
                action: () => run(() => editor.chain().focus().toggleItalic().run()),
              } as MenuItem,
              {
                label: "Gennemstregning",
                icon: <Strikethrough className="h-3.5 w-3.5" />,
                active: editor.isActive("strike"),
                action: () => run(() => editor.chain().focus().toggleStrike().run()),
              } as MenuItem,
              {
                label: "Link",
                icon: <Link className="h-3.5 w-3.5" />,
                active: editor.isActive("link"),
                action: () => {
                  const href = window.prompt("URL:", editor.getAttributes("link").href ?? "")
                  if (href !== null) {
                    if (href) {
                      editor.chain().focus().setLink({ href }).run()
                    } else {
                      editor.chain().focus().unsetLink().run()
                    }
                  }
                  close()
                },
              } as MenuItem,
              { separator: true as const },
            ]
          : []),
        {
          label: "Brødtekst",
          icon: <Type className="h-3.5 w-3.5" />,
          active: editor.isActive("paragraph"),
          action: () => run(() => editor.chain().focus().setParagraph().run()),
        },
        {
          label: "Overskrift 1",
          icon: <Heading1 className="h-3.5 w-3.5" />,
          active: editor.isActive("heading", { level: 1 }),
          action: () => run(() => editor.chain().focus().toggleHeading({ level: 1 }).run()),
        },
        {
          label: "Overskrift 2",
          icon: <Heading2 className="h-3.5 w-3.5" />,
          active: editor.isActive("heading", { level: 2 }),
          action: () => run(() => editor.chain().focus().toggleHeading({ level: 2 }).run()),
        },
        {
          label: "Overskrift 3",
          icon: <Heading3 className="h-3.5 w-3.5" />,
          active: editor.isActive("heading", { level: 3 }),
          action: () => run(() => editor.chain().focus().toggleHeading({ level: 3 }).run()),
        },
        { separator: true as const },
        {
          label: "Punktliste",
          icon: <List className="h-3.5 w-3.5" />,
          active: editor.isActive("bulletList"),
          action: () => run(() => editor.chain().focus().toggleBulletList().run()),
        },
        {
          label: "Nummereret liste",
          icon: <ListOrdered className="h-3.5 w-3.5" />,
          active: editor.isActive("orderedList"),
          action: () => run(() => editor.chain().focus().toggleOrderedList().run()),
        },
        {
          label: "Citat",
          icon: <Quote className="h-3.5 w-3.5" />,
          active: editor.isActive("blockquote"),
          action: () => run(() => editor.chain().focus().toggleBlockquote().run()),
        },
        { separator: true as const },
        {
          label: "Skillelinje",
          icon: <Minus className="h-3.5 w-3.5" />,
          action: () => run(() => editor.chain().focus().setHorizontalRule().run()),
        },
      ]

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[192px] rounded-xl border border-border bg-popover/95 backdrop-blur-sm shadow-xl py-1 overflow-hidden"
      style={{ left: menu.x, top: menu.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, i) => {
        if ("separator" in item) {
          return <div key={i} className="my-1 h-px bg-border/60 mx-2" />
        }
        return (
          <button
            key={i}
            type="button"
            className={[
              "w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left transition-colors",
              item.active
                ? "bg-accent text-accent-foreground font-medium"
                : "text-foreground hover:bg-accent/60",
            ].join(" ")}
            onMouseDown={(e) => {
              e.preventDefault()
              item.action()
            }}
          >
            <span className="text-muted-foreground">{item.icon}</span>
            {item.label}
          </button>
        )
      })}
    </div>,
    document.body
  )
}

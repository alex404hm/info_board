"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { EditorContent, useEditor, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { TableKit } from "@tiptap/extension-table"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Clipboard,
  ClipboardCopy,
  ClipboardX,
  Columns2,
  ExternalLink,
  Grid2X2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  RemoveFormatting,
  Rows2,
  Strikethrough,
  Trash2,
  Type,
  Underline as UnderlineIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

// ─── Toolbar button ───────────────────────────────────────────────────────────

function ToolbarButton({
  label,
  shortcut,
  icon: Icon,
  active,
  disabled,
  onClick,
  destructive,
}: {
  label: string
  shortcut?: string
  icon: typeof Bold
  active: boolean
  disabled: boolean
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); onClick() }}
          disabled={disabled}
          aria-label={label}
          aria-pressed={active}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40",
            destructive
              ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
              : active
                ? "bg-foreground/10 text-foreground shadow-inner"
                : "text-muted-foreground hover:bg-foreground/8 hover:text-foreground"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        <span>{label}</span>
        {shortcut && (
          <kbd className="ml-1 rounded bg-background/20 px-1 py-0.5 font-mono text-[10px]">
            {shortcut}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

function ToolbarSeparator() {
  return <span className="mx-1.5 h-4 w-px shrink-0 rounded-full bg-border/60" aria-hidden />
}

// ─── Heading dropdown ─────────────────────────────────────────────────────────

const HEADING_OPTIONS = [
  { label: "Normal tekst", icon: Type, level: 0 as const },
  { label: "Overskrift 1", icon: Heading1, level: 1 as const },
  { label: "Overskrift 2", icon: Heading2, level: 2 as const },
  { label: "Overskrift 3", icon: Heading3, level: 3 as const },
] as const

function HeadingDropdown({ editor }: { editor: Editor | null }) {
  const currentLevel = editor?.isActive("heading", { level: 1 })
    ? 1
    : editor?.isActive("heading", { level: 2 })
      ? 2
      : editor?.isActive("heading", { level: 3 })
        ? 3
        : 0

  const current = HEADING_OPTIONS.find((o) => o.level === currentLevel) ?? HEADING_OPTIONS[0]

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={!editor}
              aria-label="Tekststil"
              className={cn(
                "inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40",
                currentLevel > 0
                  ? "bg-foreground/10 text-foreground shadow-inner"
                  : "text-muted-foreground hover:bg-foreground/8 hover:text-foreground"
              )}
            >
              <current.icon className="h-3.5 w-3.5" />
              <ChevronDown className="h-3 w-3 opacity-50" />
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6}>Tekststil</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="start" sideOffset={4} className="min-w-40">
        {HEADING_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.level}
            onMouseDown={(e) => {
              e.preventDefault()
              if (!editor) return
              if (option.level === 0) {
                editor.chain().focus().setParagraph().run()
              } else {
                editor.chain().focus().toggleHeading({ level: option.level }).run()
              }
            }}
            className={cn("gap-2", currentLevel === option.level && "bg-accent text-accent-foreground")}
          >
            <option.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Link dialog ──────────────────────────────────────────────────────────────

function LinkDialog({
  initial,
  onConfirm,
  onCancel,
}: {
  initial: string
  onConfirm: (href: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(initial)
  const inputRef = useRef<HTMLInputElement>(null)
  const isEdit = Boolean(initial)

  useEffect(() => {
    const t = window.setTimeout(() => {
      inputRef.current?.focus()
      if (initial) inputRef.current?.select()
    }, 60)
    return () => window.clearTimeout(t)
  }, [initial])

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent showCloseButton={false} className="gap-4 max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Rediger link" : "Indsæt link"}</DialogTitle>
        </DialogHeader>

        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://..."
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); onConfirm(value) }
            if (e.key === "Escape") { e.preventDefault(); onCancel() }
          }}
        />

        <div className="flex items-center justify-between gap-2">
          {isEdit ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onConfirm("")}
            >
              Fjern link
            </Button>
          ) : <span />}
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Annuller
            </Button>
            <Button type="button" size="sm" onClick={() => onConfirm(value)}>
              {isEdit ? "Opdater" : "Indsæt"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Table insert — grid picker ───────────────────────────────────────────────

const GRID_COLS = 8
const GRID_ROWS = 6

function TableInsertButton({ editor }: { editor: Editor | null }) {
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState<{ col: number; row: number } | null>(null)

  function insert(cols: number, rows: number) {
    if (!editor) { setOpen(false); setHover(null); return }

    const inTable = editor.can().addColumnAfter()

    if (inTable) {
      // Cursor is inside a table — insert the new table AFTER the current one
      const { $from } = editor.state.selection
      let tableDepth = -1
      for (let d = $from.depth; d > 0; d--) {
        if ($from.node(d).type.name === "table") { tableDepth = d; break }
      }
      if (tableDepth >= 0) {
        const posAfterTable = $from.after(tableDepth)
        const headerCells = Array(cols).fill("<th><p></p></th>").join("")
        const bodyRows = Array(Math.max(1, rows - 1))
          .fill(`<tr>${Array(cols).fill("<td><p></p></td>").join("")}</tr>`)
          .join("")
        const html = `<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`
        editor.commands.insertContentAt(posAfterTable, html)
        setOpen(false)
        setHover(null)
        return
      }
    }

    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
    setOpen(false)
    setHover(null)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={!editor}
              aria-label="Indsæt tabel"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
            >
              <Grid2X2 className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6}>Indsæt tabel</TooltipContent>
      </Tooltip>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-auto p-3"
        onMouseLeave={() => setHover(null)}
      >
        <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
          {hover ? `${hover.col + 1} × ${hover.row + 1}` : "Vælg størrelse"}
        </p>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1.25rem)` }}>
          {Array.from({ length: GRID_ROWS }, (_, row) =>
            Array.from({ length: GRID_COLS }, (_, col) => {
              const highlighted = hover !== null && col <= hover.col && row <= hover.row
              return (
                <div
                  key={`${row}-${col}`}
                  className={cn(
                    "h-5 w-5 cursor-pointer rounded-sm border transition-colors",
                    highlighted ? "border-primary bg-primary/20" : "border-border/60 bg-muted/40 hover:border-primary/50"
                  )}
                  onMouseEnter={() => setHover({ col, row })}
                  onClick={() => insert(col + 1, row + 1)}
                />
              )
            })
          )}
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">Klik for at indsætte</p>
      </PopoverContent>
    </Popover>
  )
}

// ─── Table toolbar ────────────────────────────────────────────────────────────

function TableToolbar({ editor }: { editor: Editor | null }) {
  const inTable = editor?.can().addColumnAfter() ?? false
  return (
    <>
      <TableInsertButton editor={editor} />
      <ToolbarButton
        label="Tilføj kolonne"
        icon={Columns2}
        active={false}
        disabled={!editor || !inTable}
        onClick={() => editor?.chain().focus().addColumnAfter().run()}
      />
      <ToolbarButton
        label="Tilføj række"
        icon={Rows2}
        active={false}
        disabled={!editor || !inTable}
        onClick={() => editor?.chain().focus().addRowAfter().run()}
      />
      <ToolbarButton
        label="Slet tabel"
        icon={Trash2}
        active={false}
        disabled={!editor || !inTable}
        onClick={() => editor?.chain().focus().deleteTable().run()}
        destructive
      />
    </>
  )
}

// ─── Right-click context menu ─────────────────────────────────────────────────

type ContextPos = { x: number; y: number }

function ContextMenuItem({
  icon: Icon,
  label,
  shortcut,
  onClick,
  destructive,
  disabled,
}: {
  icon: typeof Bold
  label: string
  shortcut?: string
  onClick: () => void
  destructive?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors disabled:pointer-events-none disabled:opacity-40",
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-accent"
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-[11px] text-muted-foreground">{shortcut}</span>}
    </button>
  )
}

function ContextMenuSep() {
  return <div className="my-1 h-px bg-border/60" />
}

function EditorContextMenu({
  editor,
  pos,
  onClose,
  onOpenLinkDialog,
}: {
  editor: Editor
  pos: ContextPos
  onClose: () => void
  onOpenLinkDialog: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inTable = editor.can().addColumnAfter()

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  function run(action: () => void) { action(); onClose() }

  return (
    <div
      ref={ref}
      style={{ top: pos.y, left: pos.x }}
      className="fixed z-50 min-w-44 overflow-hidden rounded-xl border border-border/60 bg-card p-1 shadow-xl"
    >
      <ContextMenuItem icon={ClipboardX} label="Klip" shortcut="Ctrl+X"
        onClick={() => run(() => { document.execCommand("cut") })} />
      <ContextMenuItem icon={ClipboardCopy} label="Kopiér" shortcut="Ctrl+C"
        onClick={() => run(() => { document.execCommand("copy") })} />
      <ContextMenuItem icon={Clipboard} label="Indsæt" shortcut="Ctrl+V"
        onClick={() => {
          onClose()
          void navigator.clipboard.readText().then((text) => {
            editor.chain().focus().insertContent(text).run()
          })
        }} />

      <ContextMenuSep />

      <ContextMenuItem icon={Bold} label="Fed" shortcut="Ctrl+B"
        onClick={() => run(() => editor.chain().focus().toggleBold().run())} />
      <ContextMenuItem icon={Italic} label="Kursiv" shortcut="Ctrl+I"
        onClick={() => run(() => editor.chain().focus().toggleItalic().run())} />
      <ContextMenuItem icon={UnderlineIcon} label="Understreget" shortcut="Ctrl+U"
        onClick={() => run(() => editor.chain().focus().toggleUnderline().run())} />
      <ContextMenuItem icon={Strikethrough} label="Gennemstreget"
        onClick={() => run(() => editor.chain().focus().toggleStrike().run())} />
      <ContextMenuItem icon={RemoveFormatting} label="Fjern formatering"
        onClick={() => run(() => editor.chain().focus().unsetAllMarks().run())} />

      <ContextMenuSep />

      <ContextMenuItem
        icon={Link2}
        label={editor.isActive("link") ? "Rediger link" : "Indsæt link"}
        shortcut="Ctrl+K"
        onClick={() => { onClose(); window.setTimeout(onOpenLinkDialog, 10) }}
      />

      {inTable && (
        <>
          <ContextMenuSep />
          <ContextMenuItem icon={Columns2} label="Tilføj kolonne"
            onClick={() => run(() => editor.chain().focus().addColumnAfter().run())} />
          <ContextMenuItem icon={Rows2} label="Tilføj række"
            onClick={() => run(() => editor.chain().focus().addRowAfter().run())} />
          <ContextMenuItem icon={Trash2} label="Slet tabel" destructive
            onClick={() => run(() => editor.chain().focus().deleteTable().run())} />
        </>
      )}
    </div>
  )
}

// ─── Main editor ──────────────────────────────────────────────────────────────

export function IntranetMarkdownEditor({
  value,
  onChange,
  fullEditorHref,
}: {
  value: string
  onChange: (next: string) => void
  fullEditorHref?: string
}) {
  const [, rerender] = useState(0)
  const [contextMenu, setContextMenu] = useState<ContextPos | null>(null)
  const [linkDialog, setLinkDialog] = useState<{ href: string } | null>(null)
  const closeMenu = useCallback(() => setContextMenu(null), [])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: "https" }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TableKit,
      Placeholder.configure({ placeholder: "Skriv indholdet her…" }),
    ],
    content: value,
    editorProps: {
      attributes: { class: "tiptap-admin-editor h-full px-5 py-4 outline-none" },
    },
    onTransaction: () => rerender((n) => n + 1),
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  })

  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() === value) return
    editor.commands.setContent(value, { emitUpdate: false })
  }, [editor, value])

  function openLinkDialog() {
    if (!editor) return
    const prev = editor.getAttributes("link").href as string | undefined
    setLinkDialog({ href: prev ?? "" })
  }

  function applyLink(href: string) {
    setLinkDialog(null)
    if (!href.trim()) {
      editor?.chain().focus().unsetLink().run()
      return
    }
    editor?.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run()
  }

  return (
    <TooltipProvider delayDuration={400}>
      <div className="tiptap-admin-content overflow-hidden rounded-2xl border border-border/60 bg-card">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border/60 bg-muted/30 px-2 py-1.5">
          <HeadingDropdown editor={editor} />
          <ToolbarSeparator />

          <ToolbarButton label="Fed" shortcut="Ctrl+B" icon={Bold}
            active={editor?.isActive("bold") ?? false} disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBold().run()} />
          <ToolbarButton label="Kursiv" shortcut="Ctrl+I" icon={Italic}
            active={editor?.isActive("italic") ?? false} disabled={!editor}
            onClick={() => editor?.chain().focus().toggleItalic().run()} />
          <ToolbarButton label="Understreget" shortcut="Ctrl+U" icon={UnderlineIcon}
            active={editor?.isActive("underline") ?? false} disabled={!editor}
            onClick={() => editor?.chain().focus().toggleUnderline().run()} />
          <ToolbarButton label="Gennemstreget" icon={Strikethrough}
            active={editor?.isActive("strike") ?? false} disabled={!editor}
            onClick={() => editor?.chain().focus().toggleStrike().run()} />

          <ToolbarSeparator />

          <ToolbarButton label="Venstrejustér" icon={AlignLeft}
            active={editor?.isActive({ textAlign: "left" }) ?? false} disabled={!editor}
            onClick={() => editor?.chain().focus().setTextAlign("left").run()} />
          <ToolbarButton label="Centrér" icon={AlignCenter}
            active={editor?.isActive({ textAlign: "center" }) ?? false} disabled={!editor}
            onClick={() => editor?.chain().focus().setTextAlign("center").run()} />
          <ToolbarButton label="Højrejustér" icon={AlignRight}
            active={editor?.isActive({ textAlign: "right" }) ?? false} disabled={!editor}
            onClick={() => editor?.chain().focus().setTextAlign("right").run()} />

          <ToolbarSeparator />

          <ToolbarButton label="Punktliste" icon={List}
            active={editor?.isActive("bulletList") ?? false} disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBulletList().run()} />
          <ToolbarButton label="Nummerliste" icon={ListOrdered}
            active={editor?.isActive("orderedList") ?? false} disabled={!editor}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()} />

          <ToolbarSeparator />

          <ToolbarButton label="Vandret linje" icon={Minus}
            active={false} disabled={!editor}
            onClick={() => editor?.chain().focus().setHorizontalRule().run()} />

          <ToolbarSeparator />

          <ToolbarButton label="Link" shortcut="Ctrl+K" icon={Link2}
            active={editor?.isActive("link") ?? false} disabled={!editor}
            onClick={openLinkDialog} />

          <ToolbarSeparator />
          <TableToolbar editor={editor} />

          {fullEditorHref && (
            <>
              <ToolbarSeparator />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => window.open(fullEditorHref, "_blank", "noopener,noreferrer")}
                    aria-label="Åbn fuld editor"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>Åbn fuld editor</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {/* Editor area */}
        <ScrollArea
          className="h-105 bg-background"
          onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY }) }}
        >
          <EditorContent editor={editor} className="h-full" />
        </ScrollArea>

        {/* Right-click context menu */}
        {contextMenu && editor && (
          <EditorContextMenu
            editor={editor}
            pos={contextMenu}
            onClose={closeMenu}
            onOpenLinkDialog={openLinkDialog}
          />
        )}
      </div>

      {/* Link dialog */}
      {linkDialog && (
        <LinkDialog
          initial={linkDialog.href}
          onConfirm={applyLink}
          onCancel={() => setLinkDialog(null)}
        />
      )}
    </TooltipProvider>
  )
}

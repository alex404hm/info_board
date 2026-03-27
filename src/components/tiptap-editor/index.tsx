"use client"

import { useEffect, useRef, useState } from "react"
import { EditorContent, EditorContext, type Editor, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import TextAlign from "@tiptap/extension-text-align"
import Highlight from "@tiptap/extension-highlight"
import Underline from "@tiptap/extension-underline"
import Subscript from "@tiptap/extension-subscript"
import Superscript from "@tiptap/extension-superscript"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { Selection } from "@tiptap/extensions"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import { PdfBlock } from "@/components/tiptap-node/pdf-block-node/pdf-block-node-extension"
import { ResizableImage } from "@/components/tiptap-node/image-node/resizable-image-extension"
import { EditorContextMenu } from "@/components/tiptap-editor/editor-context-menu"
import { FileText, ImagePlus, LoaderCircle } from "lucide-react"

import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import { ColorHighlightPopover } from "@/components/tiptap-ui/color-highlight-popover"
import { LinkPopover } from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"
import { handleAssetUpload } from "@/lib/tiptap-utils"
import { normalizeIntranetEditorContent } from "@/lib/intranet-editor-content"
import { Button } from "@/components/tiptap-ui-primitive/button"

function looksLikeMarkdown(text: string): boolean {
  // Only intercept paste when there are clear block-level markdown markers
  return /(?:^#{1,6}\s|^[-*+]\s|^\d+\.\s|^>\s|^```)/m.test(text)
}

interface TiptapEditorProps {
  content?: string
  onChange?: (html: string) => void
  onReady?: (editor: Editor | null) => void
  placeholder?: string
  readOnly?: boolean
}

export function TiptapEditor({
  content,
  onChange,
  onReady,
  placeholder = "Skriv indholdet her...",
  readOnly = false,
}: TiptapEditorProps) {
  const onChangeRef = useRef(onChange)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: "tiptap-admin-editor",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: false,
      }),
      HorizontalRule,
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Underline,
      ResizableImage,
      PdfBlock,
      Superscript,
      Subscript,
      Selection,
    ],
    content: content || "",
    onCreate: ({ editor }) => {
      onReady?.(editor)
    },
    onDestroy: () => {
      onReady?.(null)
    },
    onUpdate: ({ editor }) => {
      onChangeRef.current?.(editor.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return

    const nextContent = content || ""
    const currentContent = editor.getHTML()

    if (nextContent === currentContent) return

    editor.commands.setContent(nextContent, {
      emitUpdate: false,
    })
  }, [content, editor])

  // Convert pasted markdown to rich HTML before inserting into the editor
  useEffect(() => {
    if (!editor || readOnly) return

    function handlePaste(event: ClipboardEvent) {
      const htmlData = event.clipboardData?.getData("text/html")
      if (htmlData) return // Tiptap handles HTML paste natively

      const text = event.clipboardData?.getData("text/plain") ?? ""
      if (!text || !looksLikeMarkdown(text)) return

      const html = normalizeIntranetEditorContent(text)
      if (!html || html === text) return

      event.preventDefault()
      editor.commands.insertContent(html, { parseOptions: { preserveWhitespace: false } })
    }

    const dom = editor.view.dom
    dom.addEventListener("paste", handlePaste)
    return () => dom.removeEventListener("paste", handlePaste)
  }, [editor, readOnly])

  async function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file || !editor) return

    setIsUploadingImage(true)

    try {
      const { url, name } = await handleAssetUpload(file)
      editor.chain().focus().setImage({ src: url, alt: name }).run()
    } catch (error) {
      console.error("Image upload failed:", error)
    } finally {
      setIsUploadingImage(false)
    }
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file || !editor) return

    setIsUploadingFile(true)

    try {
      const { url, name } = await handleAssetUpload(file)
      editor.chain().focus().setPdfBlock({ src: url, title: name }).run()
    } catch (error) {
      console.error("File upload failed:", error)
    } finally {
      setIsUploadingFile(false)
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileSelect}
      />
      <EditorContext.Provider value={{ editor }}>
        {!readOnly && (
          <Toolbar variant="fixed">
            <ToolbarGroup>
              <UndoRedoButton action="undo" />
              <UndoRedoButton action="redo" />
            </ToolbarGroup>

            <ToolbarSeparator />

            <ToolbarGroup>
              <HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4]} />
              <ListDropdownMenu modal={false} types={["bulletList", "orderedList", "taskList"]} />
              <BlockquoteButton />
              <CodeBlockButton />
            </ToolbarGroup>

            <ToolbarSeparator />

            <ToolbarGroup>
              <MarkButton type="bold" />
              <MarkButton type="italic" />
              <MarkButton type="strike" />
              <MarkButton type="underline" />
              <MarkButton type="code" />
              <ColorHighlightPopover />
              <LinkPopover />
            </ToolbarGroup>

            <ToolbarSeparator />

            <ToolbarGroup>
              <TextAlignButton align="left" />
              <TextAlignButton align="center" />
              <TextAlignButton align="right" />
              <TextAlignButton align="justify" />
            </ToolbarGroup>

            <ToolbarSeparator />

            <ToolbarGroup>
              <Button
                type="button"
                variant="ghost"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploadingImage}
                tooltip="Upload billede"
              >
                {isUploadingImage ? (
                  <LoaderCircle className="tiptap-button-icon animate-spin" />
                ) : (
                  <ImagePlus className="tiptap-button-icon" />
                )}
                <span className="tiptap-button-text">Billede</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingFile}
                tooltip="Upload PDF"
              >
                {isUploadingFile ? (
                  <LoaderCircle className="tiptap-button-icon animate-spin" />
                ) : (
                  <FileText className="tiptap-button-icon" />
                )}
                <span className="tiptap-button-text">PDF</span>
              </Button>
            </ToolbarGroup>
          </Toolbar>
        )}

        <EditorContent
          editor={editor}
          role="presentation"
          className="tiptap-admin-content min-h-[520px] max-h-[75vh] overflow-auto"
        />
      </EditorContext.Provider>

      {!readOnly && <EditorContextMenu editor={editor} />}
    </div>
  )
}

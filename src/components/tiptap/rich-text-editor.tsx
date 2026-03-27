"use client";
import "./tiptap.css";
import { cn } from "@/lib/utils";
import { ImageExtension } from "@/components/tiptap/extensions/image";
import { ImagePlaceholder } from "@/components/tiptap/extensions/image-placeholder";
import SearchAndReplace from "@/components/tiptap/extensions/search-and-replace";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import { EditorContent, type Extension, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TipTapFloatingMenu } from "@/components/tiptap/extensions/floating-menu";
import { FloatingToolbar } from "@/components/tiptap/extensions/floating-toolbar";
import { EditorToolbar } from "./toolbars/editor-toolbar";
import Placeholder from "@tiptap/extension-placeholder";
import { content } from "@/lib/content";
import { normalizeIntranetEditorContent } from "@/lib/intranet-editor-content";

const extensions = [
  StarterKit.configure({
    orderedList: {
      HTMLAttributes: {
        class: "list-decimal",
      },
    },
    bulletList: {
      HTMLAttributes: {
        class: "list-disc",
      },
    },
    heading: {
      levels: [1, 2, 3, 4],
    },
  }),
  Placeholder.configure({
    emptyNodeClass: "is-editor-empty",
    placeholder: ({ node }) => {
      switch (node.type.name) {
        case "heading":
          return `Heading ${node.attrs.level}`;
        case "detailsSummary":
          return "Section title";
        case "codeBlock":
          // never show the placeholder when editing code
          return "";
        default:
          return "Write, type '/' for commands";
      }
    },
    includeChildren: false,
  }),
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  TextStyle,
  Subscript,
  Superscript,
  Underline,
  Link,
  Color,
  Highlight.configure({
    multicolor: true,
  }),
  ImageExtension,
  ImagePlaceholder,
  SearchAndReplace,
  Typography,
];

export function RichTextEditorDemo({ className }: { className?: string }) {
  const TOOLBAR_HTML_BLOCK =
    /<div class="flex flex-wrap items-center gap-2">[\s\S]*?<\/div>/gi;
  const TOOLBAR_ARTIFACT_PATTERN =
    /(data-slot="button"|Upload fil|Overskrift|Billede|Liste|Citat)/i;

  const stripToolbarArtifacts = (value: string) =>
    value.replace(TOOLBAR_HTML_BLOCK, "").replace(TOOLBAR_ARTIFACT_PATTERN, "").trim();

  const extractTextFromHtml = (html: string) => {
    if (!html.trim()) return "";
    const parsed = new DOMParser().parseFromString(html, "text/html");
    return parsed.body.textContent?.trim() ?? "";
  };

  const looksLikeMarkdown = (value: string) =>
    /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+\.\s|>\s)|(\*\*|__|\*|_)([^*_]+)(\*\*|__|\*|_)|`[^`]+`|\[[^\]]+\]\([^)]+\)/m.test(
      value
    );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: extensions as Extension[],
    content,
    editorProps: {
      attributes: {
        class: "max-w-full focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      // do what you want to do with output
      // Update stats
      // saving as text/json/hmtml
      // const text = editor.getHTML();
      console.log(editor.getText());
    },
  });

  if (!editor) return null;

  return (
    <div
      className={cn(
        "relative max-h-[calc(100dvh-6rem)]  w-full overflow-hidden overflow-y-scroll border bg-card pb-[60px] sm:pb-0",
        className
      )}
    >
      <EditorToolbar editor={editor} />
      <FloatingToolbar editor={editor} />
      <TipTapFloatingMenu editor={editor} />
      <EditorContent
        editor={editor}
        onPaste={(event) => {
          const rawText = event.clipboardData?.getData("text/plain") ?? "";
          const rawHtml = event.clipboardData?.getData("text/html") ?? "";

          const cleanedText = stripToolbarArtifacts(rawText);
          const cleanedHtml = stripToolbarArtifacts(rawHtml);
          const fallbackFromHtml = extractTextFromHtml(cleanedHtml);
          const pastedText = cleanedText || fallbackFromHtml;

          if (!pastedText) {
            if (TOOLBAR_ARTIFACT_PATTERN.test(rawText) || TOOLBAR_ARTIFACT_PATTERN.test(rawHtml)) {
              event.preventDefault();
            }
            return;
          }

          if (editor.isActive("codeBlock")) return;

          const shouldNormalize =
            looksLikeMarkdown(pastedText) ||
            TOOLBAR_ARTIFACT_PATTERN.test(rawText) ||
            TOOLBAR_ARTIFACT_PATTERN.test(rawHtml);

          if (!shouldNormalize) return;

          const normalized = normalizeIntranetEditorContent(pastedText);
          if (!normalized || normalized === pastedText) return;

          event.preventDefault();
          editor.chain().focus().insertContent(normalized).run();
        }}
        className=" min-h-[600px] w-full min-w-full cursor-text sm:p-6"
      />
    </div>
  );
}

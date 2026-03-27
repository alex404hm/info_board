import { mergeAttributes, Node } from "@tiptap/react"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { PdfBlockNodeComponent } from "@/components/tiptap-node/pdf-block-node/pdf-block-node"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pdfBlock: {
      setPdfBlock: (attrs: { src: string; title: string }) => ReturnType
    }
  }
}

export const PdfBlock = Node.create({
  name: "pdfBlock",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: "" },
      height: {
        default: 480,
        parseHTML: (el) => {
          const h = el.getAttribute("data-height")
          return h ? Number(h) : 480
        },
        renderHTML: (attrs) => ({ "data-height": String(attrs.height ?? 480) }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="pdf-block"]',
        getAttrs: (dom) => {
          const el = dom as HTMLElement
          const h = el.getAttribute("data-height")
          return {
            src: el.getAttribute("data-src"),
            title: el.getAttribute("data-title") ?? "",
            height: h ? Number(h) : 480,
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        { "data-type": "pdf-block" },
        {
          "data-src": HTMLAttributes.src,
          "data-title": HTMLAttributes.title,
          "data-height": String(HTMLAttributes.height ?? 480),
        }
      ),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(PdfBlockNodeComponent)
  },

  addCommands() {
    return {
      setPdfBlock:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    }
  },
})

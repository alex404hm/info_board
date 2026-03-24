"use client"

import { Editor } from "@/components/blocks/editor-x/editor"
import { SerializedEditorState } from "lexical"

export function IntranetEditorClient({
  content,
  onSerializedChange,
}: {
  content?: string
  onSerializedChange?: (value: SerializedEditorState) => void
}) {
  let editorSerializedState: SerializedEditorState | undefined = undefined
  if (content) {
    try {
      editorSerializedState = JSON.parse(content)
    } catch {
      editorSerializedState = undefined
    }
  }
  return (
    <Editor
      editorSerializedState={editorSerializedState}
      onSerializedChange={onSerializedChange}
    />
  )
}

"use client"

import { useCallback, useEffect, useRef } from "react"
import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { EditorState, SerializedEditorState } from "lexical"

import { editorTheme } from "@/components/editor/themes/editor-theme"
import { TooltipProvider } from "@/components/ui/tooltip"

import { nodes } from "./nodes"
import { Plugins } from "./plugins"

const editorConfig: InitialConfigType = {
  namespace: "Editor",
  theme: editorTheme,
  nodes,
  onError: (error: Error) => {
    console.error(error)
  },
}

export function Editor({
  editorState,
  editorSerializedState,
  onChange,
  onSerializedChange,
  readOnly = false,
}: {
  editorState?: EditorState
  editorSerializedState?: SerializedEditorState
  onChange?: (editorState: EditorState) => void
  onSerializedChange?: (editorSerializedState: SerializedEditorState) => void
  readOnly?: boolean
}) {
  // Keep props in refs so the onChange callback never needs to change identity.
  // This prevents OnChangePlugin from re-subscribing on every parent re-render,
  // which was causing Node's async-hooks Map to overflow with Turbopack dev.
  const onChangeRef = useRef(onChange)
  const onSerializedChangeRef = useRef(onSerializedChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  useEffect(() => { onSerializedChangeRef.current = onSerializedChange }, [onSerializedChange])

  const handleChange = useCallback((state: EditorState) => {
    onChangeRef.current?.(state)
    onSerializedChangeRef.current?.(state.toJSON())
  }, []) // stable reference — never recreated

  return (
    <div className="bg-background overflow-hidden rounded-lg">
      <LexicalComposer
        initialConfig={{
          ...editorConfig,
          editable: !readOnly,
          ...(editorState ? { editorState } : {}),
          ...(editorSerializedState
            ? { editorState: JSON.stringify(editorSerializedState) }
            : {}),
        }}
      >
        <TooltipProvider>
          <Plugins readOnly={readOnly} />

          {!readOnly && (
            <OnChangePlugin
              ignoreSelectionChange={true}
              onChange={handleChange}
            />
          )}
        </TooltipProvider>
      </LexicalComposer>
    </div>
  )
}

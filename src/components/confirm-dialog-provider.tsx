"use client"

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"
import { AlertTriangle, Trash2 } from "lucide-react"

type ConfirmDialogOptions = {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  tone?: "default" | "warning" | "danger"
}

type ConfirmDialogContextValue = {
  confirm: (options?: ConfirmDialogOptions | string) => Promise<boolean>
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null)

type DialogState = ConfirmDialogOptions & {
  open: boolean
}

const CLOSED_STATE: DialogState = {
  open: false,
  title: "",
  description: "",
  confirmText: "Bekræft",
  cancelText: "Annuller",
  tone: "default",
}

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>(CLOSED_STATE)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const closeWith = useCallback((value: boolean) => {
    resolverRef.current?.(value)
    resolverRef.current = null
    setDialog(CLOSED_STATE)
  }, [])

  const confirm = useCallback((options?: ConfirmDialogOptions | string) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve

      const normalized: ConfirmDialogOptions =
        typeof options === "string"
          ? { description: options }
          : (options ?? {})

      setDialog({
        open: true,
        title: normalized.title ?? "Bekræft handling",
        description: normalized.description ?? "Er du sikker?",
        confirmText: normalized.confirmText ?? "Bekræft",
        cancelText: normalized.cancelText ?? "Annuller",
        tone: normalized.tone ?? "default",
      })
    })
  }, [])

  const contextValue = useMemo<ConfirmDialogContextValue>(() => ({ confirm }), [confirm])

  return (
    <ConfirmDialogContext.Provider value={contextValue}>
      {children}

      {dialog.open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Luk dialog"
            onClick={() => closeWith(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-2xl border border-border/70 bg-[color:var(--surface)] p-5 shadow-2xl"
          >
            <div className="mb-3 flex items-center gap-2">
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                  dialog.tone === "danger"
                    ? "bg-red-500/15 text-red-400"
                    : dialog.tone === "warning"
                    ? "bg-amber-500/15 text-amber-400"
                    : "bg-primary/15 text-primary"
                }`}
              >
                {dialog.tone === "danger" ? <Trash2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              </span>
            </div>
            <h2 className="text-base font-semibold text-foreground">
              {dialog.title}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {dialog.description}
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => closeWith(false)}
                className="rounded-lg border border-border/70 px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                {dialog.cancelText}
              </button>
              <button
                type="button"
                onClick={() => closeWith(true)}
                className={`rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition-colors ${
                  dialog.tone === "danger"
                    ? "bg-red-600 hover:bg-red-500"
                    : dialog.tone === "warning"
                    ? "bg-amber-600 hover:bg-amber-500"
                    : "bg-primary hover:bg-primary/90"
                }`}
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  )
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext)
  if (!context) {
    throw new Error("useConfirmDialog must be used within ConfirmDialogProvider")
  }
  return context.confirm
}

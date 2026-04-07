"use client"

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"

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
    setDialog((prev) => ({ ...prev, open: false }))
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

      <AlertDialog open={dialog.open} onOpenChange={(open) => !open && closeWith(false)}>
        <AlertDialogContent className="confirm-dialog-content overflow-hidden rounded-2xl shadow-xl">
          <AlertDialogHeader className="gap-2">
            <AlertDialogTitle className="confirm-dialog-title text-base font-semibold leading-tight">{dialog.title}</AlertDialogTitle>
            {dialog.description && (
              <AlertDialogDescription className="confirm-dialog-description">
                {dialog.description}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className="confirm-dialog-footer pt-4">
            <AlertDialogCancel
              className="confirm-dialog-cancel h-9 rounded-[min(var(--radius-md),12px)] px-3.5"
              onClick={() => closeWith(false)}
            >
              {dialog.cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="default"
              className="confirm-dialog-action h-9 rounded-[min(var(--radius-md),12px)] px-3.5"
              onClick={() => closeWith(true)}
            >
              {dialog.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

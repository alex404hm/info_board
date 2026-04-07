"use client"

import { useEffect } from "react"
import { useConfirmDialog } from "@/components/confirm-dialog-provider"

type UnsavedChangesGuardOptions = {
  enabled: boolean
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirmLeave?: () => void
}

export function useUnsavedChangesGuard({
  enabled,
  title = "Er du sikker på, at du vil forlade siden?",
  description = "Hvis du forlader siden nu, mister du dine ændringer.",
  confirmText = "Forlad uden at gemme",
  cancelText = "Annullere",
  onConfirmLeave,
}: UnsavedChangesGuardOptions) {
  const confirm = useConfirmDialog()

  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (allowUnload) return
      e.preventDefault()
      // Modern browsers ignore custom text here, but returnValue must be set.
      e.returnValue = description
    }

    let allowBrowserBack = false
    let isPromptOpen = false
    let allowUnload = false

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      const link = target?.closest("a[href]") as HTMLAnchorElement | null
      if (!link) return
      if (link.target && link.target !== "_self") return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      const rawHref = link.getAttribute("href") ?? ""
      if (!rawHref || rawHref.startsWith("#")) return
      if (rawHref.startsWith("mailto:") || rawHref.startsWith("tel:") || rawHref.startsWith("javascript:")) return

      const nextUrl = new URL(link.href, window.location.origin)
      const currentUrl = new URL(window.location.href)
      const nextPath = `${nextUrl.pathname}${nextUrl.search}`
      const currentPath = `${currentUrl.pathname}${currentUrl.search}`
      if (nextPath === currentPath) return

      e.preventDefault()
      e.stopPropagation()
      if (isPromptOpen) return
      isPromptOpen = true

      void confirm({
        title,
        description,
        confirmText,
        cancelText,
        tone: "warning",
      }).then((ok) => {
        if (ok) {
          onConfirmLeave?.()
          allowUnload = true
          window.location.assign(nextUrl.toString())
        }
      }).finally(() => {
        isPromptOpen = false
      })
    }

    const handlePopState = () => {
      if (allowBrowserBack) {
        allowBrowserBack = false
        return
      }

      window.history.pushState({ unsavedGuard: true }, "", window.location.href)
      if (isPromptOpen) return
      isPromptOpen = true

      void confirm({
        title,
        description,
        confirmText,
        cancelText,
        tone: "warning",
      }).then((ok) => {
        if (!ok) return
        onConfirmLeave?.()
        allowBrowserBack = true
        allowUnload = true
        window.history.back()
      }).finally(() => {
        isPromptOpen = false
      })
    }

    window.history.pushState({ unsavedGuard: true }, "", window.location.href)
    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("popstate", handlePopState)
    document.addEventListener("click", handleDocumentClick, true)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("popstate", handlePopState)
      document.removeEventListener("click", handleDocumentClick, true)
    }
  }, [cancelText, confirm, confirmText, description, enabled, onConfirmLeave, title])
}

"use client"

import { useEffect, useMemo, useState } from "react"
import type { ComponentType } from "react"
import { evaluate } from "@mdx-js/mdx"
import * as runtime from "react/jsx-runtime"
import remarkGfm from "remark-gfm"

import { getIntranetMdxComponents } from "@/components/intranet/fumadocs-mdx-components"

interface MdxContentProps {
  content: string
  className?: string
}

export function MdxContent({ content, className }: MdxContentProps) {
  const [CompiledContent, setCompiledContent] = useState<ComponentType<{ components?: Record<string, unknown> }> | null>(null)
  const [compileError, setCompileError] = useState<string | null>(null)
  const components = useMemo(() => getIntranetMdxComponents(), [])

  const normalizedContent = useMemo(
    () =>
      content
        .replace(/^\uFEFF/, "")
        .replace(/\r\n?/g, "\n")
        .replace(/\u00a0/g, " ")
        .trim(),
    [content]
  )

  useEffect(() => {
    let cancelled = false

    async function compileMdx() {
      if (!normalizedContent) {
        setCompiledContent(null)
        setCompileError(null)
        return
      }

      try {
        const evaluated = await evaluate(normalizedContent, {
          ...runtime,
          baseUrl: import.meta.url,
          remarkPlugins: [remarkGfm],
        })

        if (!cancelled) {
          setCompiledContent(() => evaluated.default)
          setCompileError(null)
        }
      } catch (error) {
        console.error("Failed to compile intranet MDX:", error)
        if (!cancelled) {
          setCompiledContent(null)
          setCompileError("Kunne ikke vise indholdet.")
        }
      }
    }

    void compileMdx()

    return () => {
      cancelled = true
    }
  }, [normalizedContent])

  if (!normalizedContent) return null

  return (
    <div className={className ? `rich-content intranet-mdx ${className}` : "rich-content intranet-mdx"}>
      {CompiledContent ? (
        <CompiledContent components={components} />
      ) : compileError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {compileError}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">Indlaeser indhold...</div>
      )}
    </div>
  )
}

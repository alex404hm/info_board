"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { StatusBar } from "@/components/StatusBar"

type ShellProps = {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function SectionPageShell({ title, subtitle, children }: ShellProps) {
  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-[#0B1120] via-[#0d1526] to-[#0B1120]">
      <StatusBar />

      <div className="shrink-0 border-b border-white/[0.08] bg-[#0B1120]/95 px-4 py-3 backdrop-blur-sm md:px-6">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-white/[0.08]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Tilbage
          </Link>

          <div className="min-w-0 flex-1 text-right">
            <h1 className="truncate text-base font-bold text-slate-100 md:text-lg">{title}</h1>
            {subtitle ? <p className="text-xs text-slate-400">{subtitle}</p> : null}
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1400px] px-4 pb-10 pt-5 md:px-6">
          {children}
        </div>
      </main>
    </div>
  )
}

"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import {
  Phone, Mail, Search, ChevronDown, ChevronUp,
  X, Check, SlidersHorizontal, Users, Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Employee } from "@/types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFeatured(list: Employee[], n = 4): Employee[] {
  const withImg = list.filter((e) => !!e.image)
  const pool = withImg.length >= n ? withImg : list
  return pool.slice(0, n)
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  employee,
  className,
  textClass = "text-sm",
}: {
  employee: Employee
  className?: string
  textClass?: string
}) {
  const [err, setErr] = useState(false)
  const initials = `${employee.firstName?.[0] ?? ""}${employee.lastName?.[0] ?? ""}`.toUpperCase()

  if (employee.image && !err) {
    return (
      <img
        src={employee.image}
        alt={employee.name}
        onError={() => setErr(true)}
        className={cn("rounded-full object-cover object-top shrink-0", className)}
      />
    )
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-bold text-violet-300 shrink-0",
        textClass,
        className,
      )}
      style={{ background: "var(--accent-soft)" }}
    >
      {initials || <Users className="h-1/2 w-1/2 opacity-50" />}
    </div>
  )
}

// ─── Featured card ────────────────────────────────────────────────────────────

function FeaturedCard({ employee }: { employee: Employee }) {
  return (
    <div className="surface-panel flex flex-col items-center gap-4 rounded-xl p-5 text-center">
      <Avatar employee={employee} className="h-20 w-20" textClass="text-2xl" />

      <div className="min-w-0 w-full">
        <p className="text-[15px] font-semibold leading-snug text-foreground-strong">{employee.name}</p>
        <p className="mt-0.5 text-xs text-subtle">
          {employee.title}
        </p>
      </div>

      <div className="w-full space-y-1.5 text-left">
        {employee.email && (
          <a
            href={`mailto:${employee.email}`}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted transition-colors hover:bg-white/[0.06]"
          >
            <Mail className="h-3.5 w-3.5 shrink-0 text-subtle" />
            <span className="truncate">{employee.email}</span>
          </a>
        )}
        {employee.phone && (
          <a
            href={`tel:${employee.phone}`}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted transition-colors hover:bg-white/[0.06]"
          >
            <Phone className="h-3.5 w-3.5 shrink-0 text-subtle" />
            {employee.phone}
          </a>
        )}
      </div>
    </div>
  )
}

// ─── Employee grid card ───────────────────────────────────────────────────────

function EmployeeCard({ employee }: { employee: Employee }) {
  return (
    <div className="surface-panel flex items-center gap-3 rounded-xl p-4">
      <Avatar employee={employee} className="h-12 w-12" textClass="text-sm" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-foreground-strong">{employee.name}</p>
        <p className="mt-0.5 truncate text-xs text-muted">
          {employee.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-subtle">
          {employee.email}
        </p>
      </div>

      {employee.phone && (
        <a
          href={`tel:${employee.phone}`}
          title={employee.phone}
          className="flex shrink-0 flex-col items-center gap-1 rounded-lg p-2 transition-colors hover:bg-white/[0.06] text-subtle"
        >
          <Phone className="h-4 w-4 text-soft" />
          <span className="hidden text-[9px] tabular-nums sm:block text-soft">
            {employee.phone.replace("+45 ", "")}
          </span>
        </a>
      )}
    </div>
  )
}

// ─── Title dropdown ───────────────────────────────────────────────────────────

function TitleDropdown({
  titles,
  active,
  onChange,
}: {
  titles: { title: string; count: number }[]
  active: string | null
  onChange: (t: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 40)
    else setQuery("")
  }, [open])

  const visible = query.trim()
    ? titles.filter((t) => t.title.toLowerCase().includes(query.toLowerCase()))
    : titles

  const activeEntry = titles.find((t) => t.title === active)

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors select-none border",
          active
            ? "bg-[color:rgba(139,92,246,0.18)] border-[color:rgba(139,92,246,0.40)] text-accent"
            : "bg-[color:var(--surface)] border-[color:var(--surface-border)] text-muted"
        )}
      >
        <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
        <span className="max-w-[160px] truncate">
          {active ? (activeEntry?.title ?? active) : "All titles"}
        </span>
        {active && (
        <span
          className="flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold tabular-nums bg-[color:rgba(139,92,246,0.35)] text-white"
        >
            {activeEntry?.count}
          </span>
        )}
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-150", open && "rotate-180")}
        />
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-72 rounded-xl surface-panel">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-light">
            <Search className="h-3.5 w-3.5 shrink-0 text-subtle" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search titles…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-foreground-strong"
            />
            {query && (
              <button onClick={() => setQuery("")}>
                <X className="h-3 w-3 text-subtle" />
              </button>
            )}
          </div>

          {/* Clear row */}
          {active && (
            <button
              onClick={() => { onChange(null); setOpen(false) }}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-white/[0.04] border-b border-light text-destructive"
            >
              <X className="h-3.5 w-3.5" />
              Clear filter
            </button>
          )}

          {/* List */}
          <div className="max-h-72 overflow-y-auto py-1">
            {visible.length === 0 ? (
              <p className="px-3 py-3 text-sm text-subtle">
                No titles match
              </p>
            ) : (
              visible.map(({ title, count }) => {
                const isActive = active === title
                return (
                  <button
                    key={title}
                    onClick={() => { onChange(isActive ? null : title); setOpen(false) }}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-white/[0.04]",
                      isActive ? "text-accent" : "text-muted"
                    )}
                  >
                    <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                      {isActive && <Check className="h-3.5 w-3.5 text-violet-300" />}
                    </span>
                    <span className="flex-1 truncate text-left">{title}</span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums font-medium",
                        isActive
                          ? "bg-[color:rgba(139,92,246,0.25)] text-foreground-strong"
                          : "bg-white/7 text-subtle"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function ContactsPanel() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeTitle, setActiveTitle] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((data) => {
        const list: Employee[] = data.employees ?? []
        setEmployees(list)
      })
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false))
  }, [])

  const featured = useMemo(() => getFeatured(employees, 4), [employees])

  const titles = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of employees) counts.set(e.title, (counts.get(e.title) ?? 0) + 1)
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([title, count]) => ({ title, count }))
  }, [employees])

  const filtered = useMemo(() => {
    let r = employees
    if (activeTitle) r = r.filter((e) => e.title === activeTitle)
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.title.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q),
      )
    }
    return r
  }, [employees, activeTitle, search])

  const visible = showAll ? filtered : filtered.slice(0, 12)
  const hasFilter = !!activeTitle || !!search.trim()


  return (
    <div className="space-y-8">

      {/* ── Featured staff ────────────────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Star className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-bold uppercase tracking-wide text-violet-400">
            Featured Staff
          </h3>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-[color:var(--surface)]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {featured.map((emp) => (
              <FeaturedCard key={emp.email} employee={emp} />
            ))}
          </div>
        )}
      </section>

      {/* ── All employees ─────────────────────────────────────────────────── */}
      <section>
        {/* Toolbar */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {/* Dropdown — leftmost */}
          {!loading && (
            <TitleDropdown
              titles={titles}
              active={activeTitle}
              onChange={(t) => { setActiveTitle(t); setShowAll(false) }}
            />
          )}

          {/* Active filter pill */}
          {activeTitle && (
            <span
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium border bg-[color:rgba(139,92,246,0.15)] border-[color:rgba(139,92,246,0.30)] text-accent"
            >
              <span className="max-w-[140px] truncate">{activeTitle}</span>
              <button onClick={() => setActiveTitle(null)} className="hover:text-white transition-colors">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          )}

          {/* Push remaining controls right */}
          <div className="flex-1" />

          {/* Heading + count */}
          <h3 className="text-sm font-bold uppercase tracking-wide text-violet-400">
            All Employees
            <span className="ml-2 font-normal normal-case tracking-normal text-subtle">
              {hasFilter ? `${filtered.length} / ${employees.length}` : employees.length}
            </span>
          </h3>

          {/* Search */}
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 bg-[color:var(--surface)] border border-[color:var(--surface-border)]"
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-subtle" />
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowAll(false) }}
              className="w-36 bg-transparent text-sm outline-none text-foreground-strong"
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X className="h-3 w-3 text-subtle" />
              </button>
            )}
          </div>

          {/* Clear all */}
          {hasFilter && (
            <button
              onClick={() => { setActiveTitle(null); setSearch(""); setShowAll(false) }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-muted hover:bg-white/[0.04]"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Employee grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-[color:var(--surface)]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14">
            <p className="text-sm text-muted">No employees found</p>
            {hasFilter && (
              <button
                onClick={() => { setActiveTitle(null); setSearch("") }}
                className="text-xs underline underline-offset-2 text-accent"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((emp) => (
                <EmployeeCard key={emp.email} employee={emp} />
              ))}
            </div>

            {filtered.length > 12 && (
            <div className="mt-5 flex justify-center">
              <button
                onClick={() => setShowAll((v) => !v)}
                className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-muted hover:bg-white/[0.04]"
              >
                  {showAll ? (
                    <>Show less <ChevronUp className="h-4 w-4" /></>
                  ) : (
                    <>Show all {filtered.length} employees <ChevronDown className="h-4 w-4" /></>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

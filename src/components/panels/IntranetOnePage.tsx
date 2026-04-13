"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ArrowUp } from "lucide-react"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api-fetch"

import { IntranetFaqMarkdown } from "@/components/intranet/IntranetFaqMarkdown"
import { DEFAULT_INTRANET_FAQ_ITEMS, type IntranetFaqItem } from "@/lib/intranet-faq"

const EASE_SMOOTH = [0.22, 1, 0.36, 1] as const

export function IntranetOnePage() {
  const [openId, setOpenId] = useState<string>("")
  const [showJumpTop, setShowJumpTop] = useState(false)
  const [items, setItems] = useState<IntranetFaqItem[]>(DEFAULT_INTRANET_FAQ_ITEMS)

  useEffect(() => {
    let mounted = true

    apiFetch("/api/intranet-faq", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!mounted || !Array.isArray(data) || !data.length) return
        setItems(data)
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const scrollEl = document.querySelector("main.custom-scrollbar") as HTMLElement | null

    const onScroll = () => {
      const y = scrollEl ? scrollEl.scrollTop : window.scrollY
      setShowJumpTop(y > 220)
    }

    onScroll()
    if (scrollEl) {
      scrollEl.addEventListener("scroll", onScroll, { passive: true })
      return () => scrollEl.removeEventListener("scroll", onScroll)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
      <section className="w-full -mt-3 -mt-6 -mt-8 pb-2 pb-4 pb-6">
        <div className="grid items-start gap-6 gap-8 grid-cols-[minmax(280px,0.78fr)_minmax(0,1.22fr)] gap-14 gap-20">
          <div className="pt-3 pt-6 pt-8 sticky top-0 z-10 self-start pl-4 pl-10">
            <div className="title-wrapper__content max-w-lg rounded-2xl p-1">
              <h2
                className="h2 bold text-[clamp(1.9rem,9.4vw,4.35rem)] leading-[0.95] tracking-[-0.045em] text-foreground"
                style={{ fontFamily: '"TEC Sans", sans-serif', fontWeight: 700 }}
              >
                Praktisk information
              </h2>
              <span
                className="text text__standfirst mt-4 block max-w-xl text-[clamp(1.05rem,5.6vw,2.2rem)] leading-[1.2] tracking-[-0.02em] text-foreground"
                style={{ fontFamily: '"TEC Sans", sans-serif', fontWeight: 400 }}
              >
                Her er god viden til dig, der skal starte i skoleoplæringen.
              </span>
            </div>
          </div>

          <div className="pt-3 pt-6 pt-8 flex flex-col" style={{ borderTop: "1px solid var(--divider)", borderBottom: "1px solid var(--divider)" }}>
            {items.map((item, index) => {
              const isOpen = openId === item.id

              return (
                <div
                  key={item.id}
                  style={{
                    background: "transparent",
                    borderTop: index === 0 ? "none" : "1px solid var(--divider)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenId((current) => (current === item.id ? "" : item.id))}
                    className="group flex w-full items-center justify-between gap-3 px-3 py-4 text-left gap-4 px-4 py-5 px-6 px-8"
                  >
                    <div className="min-w-0 flex-1">
                      <motion.span
                        initial={false}
                        animate={{
                          x: isOpen ? 10 : 0,
                          color: isOpen ? "var(--accent-strong)" : "var(--foreground)",
                        }}
                        transition={{ duration: 0.42, ease: EASE_SMOOTH }}
                        className="block text-base font-semibold leading-tight tracking-[-0.03em] group-hover:text-(--accent-strong) text-lg text-[1.55rem] text-[1.95rem]"
                      >
                        {item.title}
                      </motion.span>
                    </div>
                    <motion.span
                      initial={false}
                      animate={{
                        rotate: isOpen ? 45 : 0,
                        scale: isOpen ? 1.04 : 1,
                        color: isOpen ? "var(--accent-strong)" : "var(--foreground-muted)",
                        backgroundColor: isOpen
                          ? "color-mix(in srgb, var(--accent-strong) 12%, transparent)"
                          : "color-mix(in srgb, var(--foreground-muted) 6%, transparent)",
                        borderColor: isOpen
                          ? "color-mix(in srgb, var(--accent-strong) 20%, transparent)"
                          : "color-mix(in srgb, var(--foreground-muted) 12%, transparent)",
                      }}
                      transition={{ duration: 0.42, ease: EASE_SMOOTH }}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border backdrop-blur-sm group-hover:border-(--accent-strong) group-hover:text-(--accent-strong) h-11 w-11"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 40 41"
                        fill="none"
                        className="h-4 w-4 h-5 w-5 h-6 w-6"
                        aria-hidden="true"
                      >
                        <path
                          d="M17 2.83398V17.834H2"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                        <path
                          d="M17 38.834V23.834H2"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                        <path
                          d="M38 17.834L23 17.834L23 2.83398"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                        <path
                          d="M38 23.834L23 23.834L23 38.834"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                      </svg>
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key={`${item.id}-content`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.42, ease: EASE_SMOOTH }}
                        className="overflow-hidden"
                      >
                        <motion.div
                          initial={{ y: -10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -6, opacity: 0 }}
                          transition={{ duration: 0.3, ease: EASE_SMOOTH }}
                          className="px-3 pb-5 px-4 pb-6 px-6 pb-8 px-8"
                          style={{
                            color: "var(--foreground)",
                            fontFamily: '"Sans", sans-serif',
                          }}
                        >
                          <IntranetFaqMarkdown content={item.content} />
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={() => {
          const scrollEl = document.querySelector("main.custom-scrollbar") as HTMLElement | null
          if (scrollEl) {
            scrollEl.scrollTo({ top: 0, behavior: "smooth" })
            return
          }
          window.scrollTo({ top: 0, behavior: "smooth" })
        }}
        aria-label="Til toppen"
        className={`fixed bottom-4 right-4 z-80 inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 bottom-6 right-6 h-11 w-11 ${
          showJumpTop
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        }`}
        style={{
          bottom: "max(1rem, env(safe-area-inset-bottom))",
          right: "max(1rem, env(safe-area-inset-right))",
          background: "var(--surface)",
          borderColor: "var(--surface-border)",
          color: "var(--foreground-muted)",
          boxShadow: "0 8px 22px rgba(0,0,0,0.30)",
        }}
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </>
  )
}

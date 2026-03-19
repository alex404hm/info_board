"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { X, AlertCircle, LogOut } from "lucide-react"

const DEFAULT_IDLE_S = 30
const DEFAULT_COUNTDOWN_S = 10

export function InfoBoardIdleGuard({
  idleTime = DEFAULT_IDLE_S,
  countdownTime = DEFAULT_COUNTDOWN_S,
}: {
  idleTime?: number
  countdownTime?: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [count, setCount] = useState(countdownTime)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const isOpen = useRef(false)

  if (pathname === "/") return null

  const startIdle = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => {
      isOpen.current = true
      setVisible(true)
      setCount(countdownTime)
    }, idleTime * 1000)
  }

  const onActivity = () => {
    if (!isOpen.current) startIdle()
  }

  useEffect(() => {
    startIdle()
    window.addEventListener("mousemove", onActivity)
    window.addEventListener("keydown", onActivity)
    window.addEventListener("touchstart", onActivity, { passive: true })
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      window.removeEventListener("mousemove", onActivity)
      window.removeEventListener("keydown", onActivity)
      window.removeEventListener("touchstart", onActivity)
    }
  }, [])

  useEffect(() => {
    if (!visible) return
    countInterval.current = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(countInterval.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (countInterval.current) clearInterval(countInterval.current)
    }
  }, [visible])

  useEffect(() => {
    if (visible && count === 0) {
      router.replace("/")
    }
  }, [count, visible, router])

  const handleStay = () => {
    if (countInterval.current) clearInterval(countInterval.current)
    isOpen.current = false
    setVisible(false)
    startIdle()
  }

  const handleClose = () => {
    isOpen.current = false
    setVisible(false)
    router.replace("/")
  }

  if (!visible) return null

  const isLow = count <= 3

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#15192a]">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-8">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-8 right-8 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
          style={{
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            color: "rgba(255, 255, 255, 0.8)",
          }}
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Icon container */}
        <div className="mb-8">
          <div
            className={`h-20 w-20 flex items-center justify-center rounded-2xl backdrop-blur-lg transition-all duration-300 ${
              isLow
                ? "bg-red-500/15 border border-red-500/30 shadow-lg shadow-red-500/20"
                : "bg-cyan-500/15 border border-cyan-500/30 shadow-lg shadow-cyan-500/10"
            }`}
          >
            <AlertCircle
              className={`w-10 h-10 ${isLow ? "text-red-400" : "text-cyan-400"} transition-colors`}
            />
          </div>
        </div>

        {/* Heading */}
        <h2 className="mb-3 text-4xl font-bold text-white text-center">Are you still here?</h2>

        {/* Description */}
        <p className="mb-10 text-base text-slate-300 text-center max-w-md">
          No activity detected. You will be redirected to the home page in{" "}
          <span
            className={`font-semibold transition-colors ${isLow ? "text-red-400" : "text-cyan-300"}`}
          >
            {count}
          </span>{" "}
          second{count !== 1 ? "s" : ""}.
        </p>

        {/* Buttons container */}
        <div className="flex gap-4">
          {/* Stay button */}
          <button
            onClick={handleStay}
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-all duration-200 hover:shadow-lg"
            style={{
              background: "rgba(34, 197, 94, 0.2)",
              border: "1px solid rgba(34, 197, 94, 0.4)",
              color: "rgba(134, 239, 172, 0.9)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(34, 197, 94, 0.3)"
              e.currentTarget.style.borderColor = "rgba(34, 197, 94, 0.5)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(34, 197, 94, 0.2)"
              e.currentTarget.style.borderColor = "rgba(34, 197, 94, 0.4)"
            }}
          >
            Stay here
          </button>

          {/* Leave button */}
          <button
            onClick={handleClose}
            className="inline-flex items-center gap-1.5 rounded-lg px-6 py-3 text-sm font-medium transition-all duration-200 hover:shadow-lg"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "rgba(255, 255, 255, 0.8)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)"
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)"
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Go home
          </button>
        </div>
      </div>
    </div>
  )
}
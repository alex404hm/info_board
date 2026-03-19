"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquarePlus, X, Star, Send, CheckCircle2, Smile, Meh, Frown } from "lucide-react"

type Rating = 1 | 2 | 3 | 4 | 5

function MoodIcon({ rating }: { rating: Rating | null }) {
  if (!rating) return null
  if (rating <= 2) return <Frown className="h-4 w-4 text-rose-400" />
  if (rating === 3) return <Meh className="h-4 w-4 text-amber-400" />
  return <Smile className="h-4 w-4 text-emerald-400" />
}

const ratingLabels: Record<Rating, string> = {
  1: "Meget dårlig",
  2: "Dårlig",
  3: "OK",
  4: "God",
  5: "Fremragende",
}

const MIN_COMMENT_LENGTH = 10

export function FeedbackButton({ inline }: { inline?: boolean } = {}) {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState<Rating | null>(null)
  const [hovered, setHovered] = useState<Rating | null>(null)
  const [comment, setComment] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const trimmedComment = comment.trim()
  const commentLength = trimmedComment.length
  const canSubmit = Boolean(rating) && commentLength >= MIN_COMMENT_LENGTH && !submitting

  async function handleSubmit() {
    if (!rating || commentLength < MIN_COMMENT_LENGTH || submitting) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: trimmedComment }),
      })

      if (!res.ok) {
        setSubmitError("Du skal give både en stjerne og en kommentar for at sende feedback.")
        setSubmitting(false)
        return
      }
    } catch {
      setSubmitError("Feedback kunne ikke sendes lige nu. Prøv igen.")
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  function handleClose() {
    setOpen(false)
    setTimeout(() => {
      setRating(null)
      setHovered(null)
      setComment("")
      setSubmitted(false)
      setSubmitError(null)
    }, 300)
  }

  const displayRating = hovered ?? rating

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={
          inline
            ? "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
            : "fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl px-5 py-3.5 text-sm font-semibold"
        }
        style={
          inline
            ? {
                background: "rgba(138,180,255,0.15)",
                border: "1px solid rgba(138,180,255,0.3)",
                color: "#dbe9ff",
              }
            : {
                background: "#12305c",
                border: "1px solid rgba(138,180,255,0.28)",
                boxShadow: "0 14px 30px rgba(2,10,24,0.42)",
                color: "#dbe9ff",
              }
        }
      >
        <MessageSquarePlus className="h-4 w-4" />
        Giv feedback
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-50"
              style={{ background: "rgba(3,10,24,0.72)", backdropFilter: "blur(10px)" }}
              onClick={handleClose}
            />

            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 48, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 28, scale: 0.97 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              className="fixed bottom-24 right-6 z-50 w-[430px] max-w-[calc(100vw-3rem)] overflow-hidden rounded-3xl"
              style={{
                background: "#0d2547",
                border: "1px solid rgba(130,168,224,0.24)",
                boxShadow: "0 28px 60px rgba(2,10,24,0.56), 0 0 0 1px rgba(138,180,255,0.08)",
              }}
            >
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <div
                      className="relative px-6 pb-5 pt-6"
                      style={{ borderBottom: "1px solid rgba(130,168,224,0.18)" }}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-lg"
                          style={{ background: "rgba(138,180,255,0.12)" }}
                        >
                          <MessageSquarePlus className="h-3.5 w-3.5" style={{ color: "#8ab4ff" }} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#8ab4ff" }}>
                          Feedback
                        </span>
                      </div>
                      <p className="text-[17px] font-bold leading-snug" style={{ color: "#edf4ff" }}>
                        Hvad synes du om den nye informationsskærm?
                      </p>
                      <p className="mt-1.5 text-sm" style={{ color: "#8ea6c8" }}>
                        Din mening hjælper os med at forbedre oplevelsen for alle.
                      </p>
                      <button
                        onClick={handleClose}
                        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl transition-colors"
                        style={{ color: "#8ea6c8" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(138,180,255,0.12)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-5 px-6 py-5">
                      <div>
                        <p className="mb-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: "#8ea6c8" }}>
                          Din vurdering <span style={{ color: "#fca5a5" }}>(påkrævet)</span>
                        </p>
                        <div className="flex items-center gap-1">
                          {([1, 2, 3, 4, 5] as Rating[]).map((star) => (
                            <motion.button
                              key={star}
                              whileHover={{ scale: 1.25, y: -2 }}
                              whileTap={{ scale: 0.85 }}
                              onMouseEnter={() => setHovered(star)}
                              onMouseLeave={() => setHovered(null)}
                              onClick={() => setRating(star)}
                              className="focus:outline-none"
                            >
                              <Star
                                className="h-10 w-10"
                                style={{
                                  transition: "fill 0.1s, color 0.1s",
                                  fill: displayRating && star <= displayRating ? "#f59e0b" : "transparent",
                                  color: displayRating && star <= displayRating ? "#f59e0b" : "rgba(237,244,255,0.18)",
                                }}
                              />
                            </motion.button>
                          ))}
                          <AnimatePresence>
                            {displayRating && (
                              <motion.div
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="ml-3 flex items-center gap-1.5"
                              >
                                <MoodIcon rating={displayRating} />
                                <span className="text-sm font-semibold" style={{ color: "#dbe9ff" }}>
                                  {ratingLabels[displayRating]}
                                </span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: "#8ea6c8" }}>
                          Kommentar <span style={{ color: "#fca5a5" }}>(påkrævet, mindst 10 tegn)</span>
                        </p>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Fortæl os hvad der fungerer godt, eller hvad der kan gøres bedre..."
                          rows={3}
                          className="w-full resize-none rounded-xl px-4 py-3 text-sm focus:outline-none"
                          style={{
                            background: "#12305c",
                            border: "1px solid rgba(130,168,224,0.22)",
                            color: "#edf4ff",
                            caretColor: "#8ab4ff",
                            transition: "border-color 0.15s",
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = "rgba(138,180,255,0.45)"
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "rgba(130,168,224,0.22)"
                          }}
                        />
                        <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                          <span style={{ color: commentLength >= MIN_COMMENT_LENGTH ? "#34d399" : "#fca5a5" }}>
                            {commentLength >= MIN_COMMENT_LENGTH
                              ? "Stjerne og kommentar er klar til at blive sendt."
                              : `Skriv mindst ${MIN_COMMENT_LENGTH - commentLength} tegn mere.`}
                          </span>
                          <span style={{ color: "#8ea6c8" }}>
                            {commentLength}/{MIN_COMMENT_LENGTH}
                          </span>
                        </div>
                      </div>

                      {submitError ? (
                        <p className="text-sm font-medium" style={{ color: "#fca5a5" }}>
                          {submitError}
                        </p>
                      ) : null}

                      <motion.button
                        whileHover={canSubmit ? { scale: 1.02 } : {}}
                        whileTap={canSubmit ? { scale: 0.97 } : {}}
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold"
                        style={{
                          background: canSubmit ? "#173968" : "rgba(130,168,224,0.1)",
                          border: canSubmit ? "1px solid rgba(138,180,255,0.42)" : "1px solid rgba(130,168,224,0.14)",
                          color: canSubmit ? "#edf4ff" : "#6f86a7",
                          cursor: canSubmit ? "pointer" : "not-allowed",
                          boxShadow: canSubmit ? "0 12px 24px rgba(2,10,24,0.28)" : "none",
                        }}
                      >
                        <Send className="h-4 w-4" />
                        {submitting ? "Sender..." : "Send feedback"}
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", damping: 20, stiffness: 260 }}
                    className="flex flex-col items-center justify-center px-8 py-16 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", damping: 14, stiffness: 280, delay: 0.08 }}
                      className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
                      style={{ background: "rgba(16,185,129,0.12)", border: "2px solid rgba(16,185,129,0.3)" }}
                    >
                      <CheckCircle2 className="h-10 w-10" style={{ color: "#34d399" }} />
                    </motion.div>
                    <p className="text-xl font-bold" style={{ color: "#edf4ff" }}>
                      Tak for din feedback!
                    </p>
                    <p className="mt-2 max-w-[260px] text-sm leading-relaxed" style={{ color: "#8ea6c8" }}>
                      Vi sætter stor pris på din mening og bruger den til at forbedre informationsskærmen.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={handleClose}
                      className="mt-8 rounded-xl px-8 py-3 text-sm font-semibold"
                      style={{
                        background: "#173968",
                        border: "1px solid rgba(138,180,255,0.32)",
                        color: "#edf4ff",
                      }}
                    >
                      Luk
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

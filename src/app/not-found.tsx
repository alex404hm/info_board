"use client"

import Link from "next/link"
import React from "react"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 px-6 px-8 px-12 px-16">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full space-y-7 text-center"
        >
          <div className="space-y-3">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04, duration: 0.35, ease: "easeOut" }}
              className="text-6xl font-black tracking-tight text-blue-500/90 text-7xl"
            >
              404
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.4, ease: "easeOut" }}
              className="text-3xl font-bold tracking-tight text-foreground text-5xl"
            >
              Siden blev ikke fundet
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.35, ease: "easeOut" }}
              className="mx-auto max-w-xl text-base text-muted-foreground text-lg"
            >
              Beklager, vi kunne ikke finde den side, du leder efter.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35, ease: "easeOut" }}
          >
            <Link
              href="/"
              prefetch={false}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-blue-400/50 bg-blue-600 px-7 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70"
            >
              <ArrowLeft className="h-4 w-4" />
              Tilbage til forsiden
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
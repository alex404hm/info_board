"use client"

import Link from "next/link"

type YellowStickyNoteProps = {
  title: string
  content: string
  authorName?: string | null
  createdAt?: string
  href?: string
  linkLabel?: string
  rotation?: string
  bodyClassName?: string
}

const LINE_COUNT = 6
const LINE_START_Y = 70
const LINE_GAP = 26

function formatDate(date?: string) {
  if (!date) return null

  return new Date(date).toLocaleDateString("da-DK", {
    day: "numeric",
    month: "short",
  })
}

export function YellowStickyNote({
  title,
  content,
  authorName,
  createdAt,
  href,
  linkLabel,
  rotation,
  bodyClassName,
}: YellowStickyNoteProps) {
  const dateStr = formatDate(createdAt)
  const showMeta = authorName || dateStr

  return (
    <div style={rotation ? { rotate: rotation } : undefined}>
      <div className="yellow-sticky">
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 22,
            width: 1.5,
            background: "rgba(220,38,38,0.28)",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />

        {Array.from({ length: LINE_COUNT }).map((_, i) => (
          <div
            key={i}
            aria-hidden
            style={{
              position: "absolute",
              top: LINE_START_Y + i * LINE_GAP,
              left: 0,
              right: 0,
              height: 1,
              background: "rgba(99,130,200,0.16)",
              zIndex: 1,
              pointerEvents: "none",
            }}
          />
        ))}

        <p className="sticky-y-title">{title}</p>
        <p className={bodyClassName ?? "sticky-y-body"}>{content}</p>

        {showMeta ? (
          <div className="sticky-y-author-row">
            <span className="sticky-y-author">- {authorName ?? "Skolen"}</span>
            {dateStr ? <span className="sticky-y-date">{dateStr}</span> : null}
          </div>
        ) : null}

        {href && linkLabel ? (
          <Link href={href} className="sticky-y-link">
            {linkLabel}
          </Link>
        ) : null}
      </div>
    </div>
  )
}

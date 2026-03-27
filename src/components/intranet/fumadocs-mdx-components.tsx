"use client"
/* eslint-disable @next/next/no-img-element */

import { FileText, Paperclip } from "lucide-react"

function isPdfUrl(url: string) {
  const normalized = url.split("#")[0].split("?")[0].toLowerCase()
  return normalized.endsWith(".pdf")
}

function IntranetImage({
  src = "",
  alt = "",
  width,
}: {
  src?: string
  alt?: string
  width?: number | string
}) {
  if (!src) return null

  return (
    <figure className="intranet-media-card intranet-media-image">
      <div className="intranet-media-image-frame">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="rich-content-image"
          style={width ? { width: typeof width === "number" ? `${width}px` : width, maxWidth: "100%" } : undefined}
        />
      </div>
      {alt ? <figcaption className="intranet-media-caption">{alt}</figcaption> : null}
    </figure>
  )
}

function IntranetFile({
  href = "",
  title = "",
  height,
}: {
  href?: string
  title?: string
  height?: number | string
}) {
  if (!href) return null

  const label = title || href.split("/").pop() || href
  const iframeHeight = height
    ? typeof height === "number"
      ? `${height}px`
      : height
    : undefined

  if (isPdfUrl(href)) {
    return (
      <section className="intranet-media-card intranet-file-card">
        <div className="intranet-file-card-header">
          <div className="intranet-file-card-icon">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="intranet-file-card-title">{label}</p>
            <p className="intranet-file-card-meta">PDF dokument</p>
          </div>
          <a href={href} target="_blank" rel="noopener noreferrer" className="intranet-file-card-link">
            Åbn
          </a>
        </div>
        <div className="rich-content-pdf-wrapper">
          <iframe
            src={`${href}#toolbar=0&navpanes=0&scrollbar=1`}
            title={label}
            className="rich-content-pdf"
            style={iframeHeight ? { minHeight: iframeHeight } : undefined}
          />
        </div>
      </section>
    )
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="intranet-media-card intranet-file-link">
      <span className="intranet-file-card-icon">
        <Paperclip className="h-5 w-5" />
      </span>
      <span className="intranet-file-card-title">{label}</span>
    </a>
  )
}

export function getIntranetMdxComponents() {
  return {
    IntranetImage,
    IntranetFile,
  }
}

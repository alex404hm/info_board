export type IntranetDocument = {
  id: string
  title: string
  url: string         // e.g. /uploads/uuid.pdf
  originalName: string
  uploadedAt: string  // ISO string
}

export const INTRANET_DOCUMENTS_SETTING_KEY = "intranet_documents"

export function normalizeIntranetDocuments(input: unknown): IntranetDocument[] {
  if (!Array.isArray(input)) return []

  return input
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const raw = item as Partial<IntranetDocument>
      const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : null
      const title = typeof raw.title === "string" ? raw.title.trim() : ""
      const url = typeof raw.url === "string" && raw.url.trim() ? raw.url.trim() : null
      const originalName = typeof raw.originalName === "string" ? raw.originalName.trim() : ""
      const uploadedAt = typeof raw.uploadedAt === "string" ? raw.uploadedAt : new Date().toISOString()
      if (!id || !url) return null
      return { id, title, url, originalName, uploadedAt }
    })
    .filter((doc): doc is IntranetDocument => Boolean(doc))
}

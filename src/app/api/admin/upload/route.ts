import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
  "application/pdf",
])

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = getUserRole(session)

  if (!session || !["admin", "teacher"].includes(role || "")) {
    return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Ingen fil angivet" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Filtypen er ikke tilladt. Kun billeder og PDF-filer accepteres." },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Filen er for stor. Maksimal størrelse er 10 MB." },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const ext = originalName.split(".").pop()?.toLowerCase() || "bin"
    const filename = `${crypto.randomUUID()}.${ext}`

    const uploadDir = join(process.cwd(), "public", "uploads")
    await mkdir(uploadDir, { recursive: true })
    await writeFile(join(uploadDir, filename), buffer)

    return NextResponse.json({ url: `/uploads/${filename}`, name: file.name })
  } catch (error) {
    console.error("Upload failed:", error)
    return NextResponse.json({ error: "Upload mislykkedes" }, { status: 500 })
  }
}

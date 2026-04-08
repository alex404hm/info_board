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
  "image/avif",
  "application/pdf",
])

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

function looksLikePdf(buffer: Buffer): boolean {
  return buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-"
}

function looksLikeImage(buffer: Buffer, type: string): boolean {
  if (type === "image/png") {
    return buffer.length >= 8
      && buffer[0] === 0x89
      && buffer[1] === 0x50
      && buffer[2] === 0x4e
      && buffer[3] === 0x47
      && buffer[4] === 0x0d
      && buffer[5] === 0x0a
      && buffer[6] === 0x1a
      && buffer[7] === 0x0a
  }

  if (type === "image/jpeg" || type === "image/jpg") {
    return buffer.length >= 3
      && buffer[0] === 0xff
      && buffer[1] === 0xd8
      && buffer[2] === 0xff
  }

  if (type === "image/gif") {
    const header = buffer.subarray(0, 6).toString("ascii")
    return header === "GIF87a" || header === "GIF89a"
  }

  if (type === "image/webp") {
    return buffer.length >= 12
      && buffer.subarray(0, 4).toString("ascii") === "RIFF"
      && buffer.subarray(8, 12).toString("ascii") === "WEBP"
  }

  if (type === "image/avif") {
    return buffer.length >= 12
      && buffer.subarray(4, 8).toString("ascii") === "ftyp"
      && buffer.subarray(8, 12).toString("ascii").includes("avif")
  }

  return false
}

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

    if (file.type.startsWith("image/")) {
      if (!looksLikeImage(buffer, file.type)) {
        return NextResponse.json({ error: "Filens indhold matcher ikke den angivne billedtype." }, { status: 400 })
      }
    } else if (file.type === "application/pdf") {
      if (!looksLikePdf(buffer)) {
        return NextResponse.json({ error: "Filens indhold matcher ikke PDF-format." }, { status: 400 })
      }
    }

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

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { headers } from "next/headers"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

const MAX_SIZE  = 4 * 1024 * 1024 // 4 MB
const ALLOWED   = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars")

function matchesImageSignature(buffer: Buffer, type: string): boolean {
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

  if (type === "image/jpeg") {
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

  return false
}

export async function POST(req: NextRequest) {
  const sess = await auth.api.getSession({ headers: await headers() })
  if (!sess) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
  const role = getUserRole(sess)
  if (!["admin", "teacher"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbudt" }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get("avatar") as File | null
  if (!file) return NextResponse.json({ error: "Ingen fil" }, { status: 400 })
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Ikke-understøttet filtype" }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Filen er for stor (maks 4 MB)" }, { status: 400 })
  }

  const ext      = file.type.split("/")[1].replace("jpeg", "jpg")
  const filename = `${sess.user.id}-${Date.now()}.${ext}`
  const bytes    = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  if (!matchesImageSignature(buffer, file.type)) {
    return NextResponse.json({ error: "Filindhold matcher ikke filtypen" }, { status: 400 })
  }

  await mkdir(UPLOAD_DIR, { recursive: true })
  await writeFile(path.join(UPLOAD_DIR, filename), buffer)

  return NextResponse.json({ url: `/uploads/avatars/${filename}` })
}

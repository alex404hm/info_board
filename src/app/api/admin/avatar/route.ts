import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { headers } from "next/headers"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

const MAX_SIZE  = 4 * 1024 * 1024 // 4 MB
const ALLOWED   = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars")

export async function POST(req: NextRequest) {
  const sess = await auth.api.getSession({ headers: await headers() })
  if (!sess) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const role = getUserRole(sess)
  if (!["admin", "teacher"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get("avatar") as File | null
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 4 MB)" }, { status: 400 })
  }

  const ext      = file.type.split("/")[1].replace("jpeg", "jpg")
  const filename = `${sess.user.id}-${Date.now()}.${ext}`
  const bytes    = await file.arrayBuffer()

  await mkdir(UPLOAD_DIR, { recursive: true })
  await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(bytes))

  return NextResponse.json({ url: `/uploads/avatars/${filename}` })
}

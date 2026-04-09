"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function AdminIntranetFullEditorPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin/intranet")
  }, [router])

  return (
    <div className="mx-auto flex min-h-[40svh] w-full max-w-3xl flex-col items-center justify-center gap-3 p-6 text-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      <div>
        <p className="text-sm font-medium text-foreground">Viderestiller til intranet-admin...</p>
        <p className="text-xs text-muted-foreground">Redigering foregår nu direkte på siden.</p>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useSession, authClient } from "@/lib/auth-client"
import { ShieldCheck, ShieldOff } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import TwoFactorSetup from "./TwoFactorSetup"

export default function Settings2FA() {
  const { data: sessionData, refetch } = useSession()
  const twoFactorEnabled = sessionData?.user?.twoFactorEnabled

  const [showDisableModal, setShowDisableModal] = useState(false)
  const [disablePassword, setDisablePassword] = useState("")
  const [disableError, setDisableError] = useState("")
  const [disableLoading, setDisableLoading] = useState(false)

  async function handleDisable() {
    setDisableError("")
    setDisableLoading(true)
    try {
      const res = await authClient.twoFactor.disable({ password: disablePassword })
      if (res.error) {
        setDisableError(res.error.message ?? "Wrong password. Please try again.")
      } else {
        setShowDisableModal(false)
        setDisablePassword("")
        await refetch?.()
      }
    } catch (err: any) {
      setDisableError(err?.message ?? "Something went wrong.")
    }
    setDisableLoading(false)
  }

  if (twoFactorEnabled) {
    return (
      <>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 flex-1">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-400">2FA is enabled</p>
              <p className="text-xs text-muted-foreground">
                Your account is protected with two-factor authentication.
              </p>
            </div>
          </div>
          <button
            onClick={() => { setDisableError(""); setShowDisableModal(true) }}
            className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors shrink-0"
          >
            <ShieldOff className="h-4 w-4" />
            Disable
          </button>
        </div>

        <Dialog open={showDisableModal} onOpenChange={setShowDisableModal}>
          <DialogContent className="space-y-4">
            <DialogHeader>
              <DialogTitle>Disable two-factor authentication</DialogTitle>
              <DialogDescription>
                Enter your password to turn off 2FA. Your account will be less secure.
              </DialogDescription>
            </DialogHeader>
            <Input
              type="password"
              placeholder="Your password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !disableLoading && handleDisable()}
            />
            {disableError && <p className="text-sm text-red-400">{disableError}</p>}
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={disableLoading || !disablePassword}
              className="w-full"
            >
              {disableLoading ? "Disabling…" : "Disable 2FA"}
            </Button>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Two-factor authentication adds an extra layer of security. Once enabled, you will be asked
        for a code from your authenticator app each time you sign in.
      </p>
      <TwoFactorSetup onEnabled={async () => { await refetch?.() }} />
    </div>
  )
}

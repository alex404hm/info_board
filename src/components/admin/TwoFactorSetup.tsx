"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import QRCode from "react-qr-code"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Props {
  onEnabled?: () => void
}

export default function TwoFactorSetup({ onEnabled }: Props) {
  const [password, setPassword] = useState("")
  const [totpURI, setTotpURI] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [stage, setStage] = useState<1 | 2 | 3>(1)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  async function handleEnable2FA() {
    setError("")
    try {
      const res = await authClient.twoFactor.enable({ password })
      if (res.data?.totpURI) {
        setTotpURI(res.data.totpURI)
        setShowPasswordModal(false)
        setStage(2)
      } else {
        setError("Could not fetch QR code. Please try again.")
      }
    } catch (err: any) {
      setError(err?.message || "Wrong password or error.")
    }
  }

  async function handleVerifyTOTP() {
    setError("")
    try {
      await authClient.twoFactor.verifyTotp({ code })
      setStage(3)
      onEnabled?.()
    } catch (err: any) {
      setError(err?.message || "Invalid code.")
    }
  }

  if (stage === 3) {
    return (
      <div className="text-center space-y-2 py-4">
        <p className="text-green-500 font-semibold">2FA is now enabled!</p>
        <p className="text-sm text-muted-foreground">
          Your account is protected with two-factor authentication.
        </p>
      </div>
    )
  }

  if (stage === 2 && totpURI) {
    return (
      <div className="flex flex-col gap-4 items-center py-4">
        <QRCode value={totpURI} />
        <p className="text-center text-sm text-muted-foreground">
          Scan the QR code with your authenticator app.
        </p>
        <Input
          type="text"
          inputMode="numeric"
          placeholder="Enter 6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Button onClick={handleVerifyTOTP} className="w-full">Verify code</Button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    )
  }

  return (
    <>
      <Button onClick={() => { setError(""); setShowPasswordModal(true) }}>
        Enable 2FA
      </Button>

      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="space-y-4">
          <DialogHeader>
            <DialogTitle>Confirm password</DialogTitle>
            <DialogDescription>
              Enter your password to continue.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEnable2FA()}
          />
          <Button onClick={handleEnable2FA} className="w-full">
            Get QR code
          </Button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </DialogContent>
      </Dialog>
    </>
  )
}

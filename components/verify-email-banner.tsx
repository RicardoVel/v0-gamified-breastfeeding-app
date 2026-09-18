"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MailWarning, RefreshCw, CheckCircle, X } from "lucide-react"

interface VerifyEmailBannerProps {
  email: string
}

export function VerifyEmailBanner({ email }: VerifyEmailBannerProps) {
  const [isResending, setIsResending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const handleResend = async () => {
    if (cooldown > 0) return

    setIsResending(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (resendError) throw resendError

      setSuccess(true)
      setCooldown(60)
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo enviar el correo"
      if (msg.toLowerCase().includes("rate limit")) {
        setError("Demasiados intentos. Espera unos minutos.")
        setCooldown(120)
        const timer = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setError(msg)
      }
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Card className="rounded-2xl p-3 sm:p-4 shadow-lg border-amber-200 bg-amber-50/80">
      <div className="flex items-start gap-3">
        <MailWarning size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <p className="text-sm font-semibold text-amber-800">Correo no verificado</p>
            <p className="text-xs text-amber-700">
              Verifica tu correo <span className="font-medium">{email}</span> para proteger tu cuenta.
            </p>
          </div>

          {success && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg">
              <CheckCircle size={14} className="flex-shrink-0" />
              <span>Correo enviado. Revisa tu bandeja de entrada.</span>
            </div>
          )}

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 p-2 rounded-lg">
              {error}
            </div>
          )}

          <Button
            onClick={handleResend}
            disabled={isResending || cooldown > 0}
            size="sm"
            variant="outline"
            className="h-7 rounded-lg text-[11px] bg-white border-amber-300 text-amber-800 hover:bg-amber-100"
          >
            {isResending ? (
              <><RefreshCw size={12} className="animate-spin mr-1" /> Enviando...</>
            ) : cooldown > 0 ? (
              `Reenviar en ${cooldown}s`
            ) : (
              <><RefreshCw size={12} className="mr-1" /> Enviar correo de verificacion</>
            )}
          </Button>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-600 flex-shrink-0"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
      </div>
    </Card>
  )
}

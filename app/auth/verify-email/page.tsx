"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Sparkles, RefreshCw, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState, Suspense } from "react"
import { createClient } from "@/lib/supabase/client"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  const handleResend = async () => {
    if (!email || cooldown > 0) return

    setIsResending(true)
    setResendError(null)
    setResendSuccess(false)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setResendSuccess(true)
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
      const msg = err instanceof Error ? err.message : "No se pudo reenviar el correo"
      if (msg.toLowerCase().includes("rate limit")) {
        setResendError("Se han enviado demasiados correos. Por favor espera unos minutos antes de intentar nuevamente.")
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
        setResendError(msg)
      }
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="text-center space-y-2">
            <Sparkles className="text-soft-gold mx-auto animate-sparkle" size={48} />
            <h1 className="text-3xl font-bold text-balance">Casi listo!</h1>
          </div>

          <Card className="rounded-3xl shadow-xl border-2">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 bg-primary/10 p-4 rounded-full w-fit">
                <Mail className="text-primary" size={32} />
              </div>
              <CardTitle className="text-2xl">Verifica tu correo</CardTitle>
              <CardDescription className="text-base">
                Te hemos enviado un enlace de verificacion
                {email && (
                  <span className="block font-semibold text-foreground mt-1">{email}</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-xl text-sm text-center space-y-2">
                <p className="font-medium">Por favor revisa tu bandeja de entrada</p>
                <p className="text-muted-foreground text-pretty">
                  Haz clic en el enlace que te enviamos para activar tu cuenta y comenzar a jugar.
                  Revisa tambien la carpeta de spam.
                </p>
              </div>

              {resendSuccess && (
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 p-3 rounded-xl text-sm">
                  <CheckCircle size={16} className="flex-shrink-0" />
                  <span>Correo reenviado exitosamente</span>
                </div>
              )}

              {resendError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl">
                  {resendError}
                </div>
              )}

              <div className="space-y-2 pt-2">
                {email && (
                  <Button
                    onClick={handleResend}
                    disabled={isResending || cooldown > 0}
                    variant="outline"
                    className="w-full rounded-xl"
                  >
                    {isResending ? (
                      <><RefreshCw size={16} className="animate-spin mr-2" /> Reenviando...</>
                    ) : cooldown > 0 ? (
                      `Reenviar en ${cooldown}s`
                    ) : (
                      <><RefreshCw size={16} className="mr-2" /> Reenviar correo de verificacion</>
                    )}
                  </Button>
                )}

                <Button asChild variant="outline" className="w-full rounded-xl bg-transparent">
                  <Link href="/auth/login">Volver al inicio de sesion</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="animate-spin text-muted-foreground" size={24} />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

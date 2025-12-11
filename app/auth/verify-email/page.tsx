import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Sparkles } from "lucide-react"
import Link from "next/link"

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="text-center space-y-2">
            <Sparkles className="text-soft-gold mx-auto animate-sparkle" size={48} />
            <h1 className="text-3xl font-bold text-balance">¡Casi listo!</h1>
          </div>

          <Card className="rounded-3xl shadow-xl border-2">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 bg-primary/10 p-4 rounded-full w-fit">
                <Mail className="text-primary" size={32} />
              </div>
              <CardTitle className="text-2xl">Verifica tu correo</CardTitle>
              <CardDescription className="text-base">
                Te hemos enviado un enlace de verificación a tu correo electrónico
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-xl text-sm text-center space-y-2">
                <p className="font-medium">Por favor revisa tu bandeja de entrada</p>
                <p className="text-muted-foreground text-pretty">
                  Haz clic en el enlace que te enviamos para activar tu cuenta y comenzar a jugar
                </p>
              </div>

              <div className="pt-4">
                <Button asChild variant="outline" className="w-full rounded-xl bg-transparent">
                  <Link href="/auth/login">Volver al inicio de sesión</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/game`,
          data: {
            display_name: displayName,
          },
        },
      })

      if (signUpError) throw signUpError

      // If email confirmation is disabled, the user will be automatically signed in
      if (signUpData.session) {
        // User is already logged in, redirect to game
        window.location.href = "/game"
      } else {
        // Email confirmation is required
        window.location.href = "/auth/verify-email"
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="text-center space-y-2">
            <Sparkles className="text-pastel-pink mx-auto" size={48} />
            <h1 className="text-3xl font-bold text-balance">Comienza tu Aventura</h1>
          </div>

          <Card className="rounded-3xl shadow-xl border-2">
            <CardHeader>
              <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
              <CardDescription>Únete a Gotas de Vida y aprende jugando</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="displayName">Nombre</Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Tu nombre"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@correo.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
                  </div>
                  {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl">{error}</div>}
                  <Button type="submit" className="w-full rounded-xl" disabled={isLoading}>
                    {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  ¿Ya tienes cuenta?{" "}
                  <Link href="/auth/login" className="text-primary underline underline-offset-4 font-semibold">
                    Inicia sesión
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Star, Trophy, Heart, Sparkles } from "lucide-react"
import Link from "next/link"

export default async function GamePage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("users").select("*").eq("id", data.user.id).single()

  const levels = [
    {
      id: 1,
      title: "Nivel 1: Beneficios del Bebé",
      description: "Aprende cómo la leche materna ayuda al bebé",
      icon: Heart,
      color: "pastel-pink",
      locked: false,
    },
    {
      id: 2,
      title: "Nivel 2: Beneficios de la Mamá",
      description: "Descubre los beneficios para la madre",
      icon: Sparkles,
      color: "soft-gold",
      locked: profile?.level ? profile.level < 2 : true,
    },
    {
      id: 3,
      title: "Nivel 3: Mitos y Realidades",
      description: "Distingue entre mitos y verdades",
      icon: Trophy,
      color: "sky-blue",
      locked: profile?.level ? profile.level < 3 : true,
    },
  ]

  return (
    <div className="min-h-screen p-3 sm:p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-4 shadow-xl">
          <div className="space-y-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-balance">¡Hola, {profile?.display_name || "Mamá"}!</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Continúa tu aventura de aprendizaje</p>
            </div>
            <div className="flex gap-4 justify-center">
              <div className="text-center">
                <div className="text-xl font-bold text-soft-gold flex items-center gap-1 justify-center">
                  <Star size={20} fill="currentColor" />
                  {profile?.total_stars || 0}
                </div>
                <p className="text-[10px] text-muted-foreground">Estrellas</p>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-sky-blue">Nivel {profile?.level || 1}</div>
                <p className="text-[10px] text-muted-foreground">Actual</p>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-pastel-pink">{profile?.experience_points || 0}</div>
                <p className="text-[10px] text-muted-foreground">XP</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold px-1">Niveles Disponibles</h2>
          <div className="grid gap-3">
            {levels.map((level) => {
              const Icon = level.icon
              return (
                <Card
                  key={level.id}
                  className={`rounded-3xl p-4 shadow-lg border-2 transition-all ${
                    level.locked ? "opacity-50 cursor-not-allowed" : "hover:shadow-xl"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl bg-${level.color}/20 flex-shrink-0`}>
                      <Icon className={`text-${level.color}`} size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-bold mb-0.5 truncate">{level.title}</h3>
                      <p className="text-xs text-muted-foreground text-pretty line-clamp-2">{level.description}</p>
                    </div>
                    {level.locked ? (
                      <Button disabled size="sm" className="rounded-xl text-xs flex-shrink-0">
                        Bloqueado
                      </Button>
                    ) : (
                      <Button asChild size="sm" className="rounded-xl text-xs flex-shrink-0">
                        <Link href={`/game/level/${level.id}`}>Jugar</Link>
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        <div className="text-center pb-4">
          <Button asChild variant="outline" size="sm" className="rounded-xl bg-transparent text-xs">
            <Link href="/profile">Ver Mi Perfil</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

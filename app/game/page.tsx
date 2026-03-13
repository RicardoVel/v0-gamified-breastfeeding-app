import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Star, Trophy, Heart, Sparkles, ShieldCheck, Baby, BookOpen, Clock, Apple, Stethoscope } from "lucide-react"
import Link from "next/link"
import { MainMusic } from "@/components/main-music"

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
      title: "Nivel 1: Beneficios del Bebe",
      description: "Aprende como la leche materna ayuda al bebe",
      icon: Heart,
      color: "pastel-pink",
      locked: false,
    },
    {
      id: 2,
      title: "Nivel 2: Mitos y Verdades",
      description: "Clasifica mitos y verdades sobre la lactancia",
      icon: Sparkles,
      color: "soft-gold",
      locked: profile?.level ? profile.level < 2 : true,
    },
    {
      id: 3,
      title: "Nivel 3: Posiciones de Lactancia",
      description: "Identifica las posiciones para amamantar",
      icon: Baby,
      color: "sky-blue",
      locked: profile?.level ? profile.level < 3 : true,
    },
    {
      id: 4,
      title: "Nivel 4: Agarre Correcto",
      description: "Identifica las partes del agarre al pecho",
      icon: Heart,
      color: "pastel-pink",
      locked: profile?.level ? profile.level < 4 : true,
    },
    {
      id: 5,
      title: "Nivel 5: Dolor y Grietas",
      description: "Juego de memoria sobre soluciones al dolor",
      icon: Stethoscope,
      color: "soft-gold",
      locked: profile?.level ? profile.level < 5 : true,
    },
    {
      id: 6,
      title: "Nivel 6: Congestion Mamaria",
      description: "Ordena los pasos para aliviar la congestion",
      icon: BookOpen,
      color: "sky-blue",
      locked: profile?.level ? profile.level < 6 : true,
    },
    {
      id: 7,
      title: "Nivel 7: Sopa de Letras",
      description: "Encuentra palabras sobre cuidados mamarios",
      icon: ShieldCheck,
      color: "pastel-pink",
      locked: profile?.level ? profile.level < 7 : true,
    },
    {
      id: 8,
      title: "Nivel 8: Mastitis",
      description: "Verdadero o falso sobre la mastitis",
      icon: Clock,
      color: "soft-gold",
      locked: profile?.level ? profile.level < 8 : true,
    },
    {
      id: 9,
      title: "Nivel 9: Haz Florecer el Jardin",
      description: "Clasifica que favorece y que no la lactancia",
      icon: Sparkles,
      color: "sky-blue",
      locked: profile?.level ? profile.level < 9 : true,
    },
    {
      id: 10,
      title: "Nivel 10: Signos de Buena Alimentacion",
      description: "Identifica los signos de un bebe bien alimentado",
      icon: Trophy,
      color: "soft-gold",
      locked: profile?.level ? profile.level < 10 : true,
    },
  ]

  return (
    <div className="min-h-screen p-2 sm:p-3 md:p-4 overflow-x-hidden">
      <MainMusic />
      <div className="max-w-2xl mx-auto space-y-4 w-full">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xl overflow-hidden">
          <div className="space-y-2 sm:space-y-3">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-balance truncate">¡Hola, {profile?.display_name || "Mama"}!</h1>
              <p className="text-[10px] sm:text-sm text-muted-foreground">Continua tu aventura de aprendizaje</p>
            </div>
            <div className="flex gap-3 sm:gap-4 justify-center">
              <div className="text-center min-w-0">
                <div className="text-lg sm:text-xl font-bold text-soft-gold flex items-center gap-1 justify-center">
                  <Star size={16} fill="currentColor" className="flex-shrink-0" />
                  {profile?.total_stars || 0}
                </div>
                <p className="text-[10px] text-muted-foreground">Estrellas</p>
              </div>
              <div className="text-center min-w-0">
                <div className="text-lg sm:text-xl font-bold text-sky-blue">Nivel {profile?.level || 1}</div>
                <p className="text-[10px] text-muted-foreground">Actual</p>
              </div>
              <div className="text-center min-w-0">
                <div className="text-lg sm:text-xl font-bold text-pastel-pink">{profile?.experience_points || 0}</div>
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
                  className={`rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-lg border-2 transition-all overflow-hidden ${
                    level.locked ? "opacity-50 cursor-not-allowed" : "hover:shadow-xl"
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-${level.color}/20 flex-shrink-0`}>
                      <Icon className={`text-${level.color}`} size={22} />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h3 className="text-xs sm:text-sm font-bold mb-0.5 truncate">{level.title}</h3>
                      <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">{level.description}</p>
                    </div>
                    {level.locked ? (
                      <Button disabled size="sm" className="rounded-xl text-[10px] sm:text-xs px-2 sm:px-3 flex-shrink-0 h-8">
                        Bloqueado
                      </Button>
                    ) : (
                      <Button asChild size="sm" className="rounded-xl text-[10px] sm:text-xs px-2 sm:px-3 flex-shrink-0 h-8">
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

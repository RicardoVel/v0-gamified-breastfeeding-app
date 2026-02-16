import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Star, Trophy, Award, MailWarning } from "lucide-react"
import { LogoutButton } from "@/components/logout-button"
import { VerifyEmailBanner } from "@/components/verify-email-banner"
import Link from "next/link"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("users").select("*").eq("id", data.user.id).single()

  // Get game progress
  const { data: gameProgress } = await supabase
    .from("game_progress")
    .select("*")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })

  // Get achievements
  const { data: achievements } = await supabase.from("achievements").select("*").eq("user_id", data.user.id)

  const completedLevels = gameProgress?.filter((p) => p.completed).length || 0
  const totalGames = gameProgress?.length || 0
  const isEmailVerified = !!data.user.email_confirmed_at

  return (
    <div className="min-h-screen p-3 sm:p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Email Verification Banner */}
        {!isEmailVerified && data.user.email && (
          <VerifyEmailBanner email={data.user.email} />
        )}

        {/* Profile Header */}
        <Card className="rounded-3xl p-5 shadow-xl bg-gradient-to-br from-white to-primary/10">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">{profile?.display_name || "Mamá"}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{data.user.email}</p>
              <div className="flex items-center gap-2 text-base sm:text-lg font-semibold text-sky-blue">
                <Trophy size={20} />
                Nivel {profile?.level || 1}
              </div>
            </div>
            <LogoutButton />
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="rounded-3xl p-4 text-center space-y-1 shadow-lg">
            <Star className="text-soft-gold mx-auto" size={28} fill="currentColor" />
            <div className="text-xl sm:text-2xl font-bold">{profile?.total_stars || 0}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Estrellas</p>
          </Card>

          <Card className="rounded-3xl p-4 text-center space-y-1 shadow-lg">
            <Trophy className="text-sky-blue mx-auto" size={28} />
            <div className="text-xl sm:text-2xl font-bold">{completedLevels}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Completados</p>
          </Card>

          <Card className="rounded-3xl p-4 text-center space-y-1 shadow-lg">
            <Award className="text-pastel-pink mx-auto" size={28} />
            <div className="text-xl sm:text-2xl font-bold">{achievements?.length || 0}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Logros</p>
          </Card>
        </div>

        {/* Experience Progress */}
        <Card className="rounded-3xl p-4 shadow-xl">
          <h2 className="text-base sm:text-lg font-bold mb-3">Progreso de Experiencia</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Nivel {profile?.level || 1}</span>
              <span>Nivel {(profile?.level || 1) + 1}</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-blue to-pastel-pink transition-all"
                style={{
                  width: `${((profile?.experience_points || 0) % 30) * (100 / 30)}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {profile?.experience_points || 0} / {(profile?.level || 1) * 30} XP
            </p>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="rounded-3xl p-4 shadow-xl">
          <h2 className="text-base sm:text-lg font-bold mb-3">Actividad Reciente</h2>
          {totalGames === 0 ? (
            <p className="text-xs sm:text-sm text-muted-foreground text-center py-6">
              Aún no has jugado ningún nivel. ¡Comienza ahora!
            </p>
          ) : (
            <div className="space-y-2">
              {gameProgress?.slice(0, 5).map((progress) => (
                <div key={progress.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">Nivel {progress.level}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(progress.created_at).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {[...Array(progress.stars_earned)].map((_, i) => (
                      <Star key={i} size={16} className="text-soft-gold fill-soft-gold" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="flex justify-center pb-4">
          <Button asChild size="sm" className="rounded-xl text-xs">
            <Link href="/game">Volver a Jugar</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

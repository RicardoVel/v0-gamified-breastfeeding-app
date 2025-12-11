import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, Star, Heart } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Floating stars decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <Star className="absolute top-20 left-10 text-soft-gold opacity-30 animate-float" size={16} />
        <Star
          className="absolute top-32 right-16 text-soft-gold opacity-40 animate-float"
          size={12}
          style={{ animationDelay: "1s" }}
        />
        <Sparkles className="absolute bottom-32 left-1/4 text-pastel-pink opacity-30 animate-sparkle" size={14} />
        <Heart
          className="absolute top-1/3 right-12 text-pastel-pink opacity-20 animate-float"
          size={20}
          style={{ animationDelay: "0.5s" }}
        />
      </div>

      <main className="max-w-md w-full text-center space-y-6 relative z-10">
        <div className="space-y-3">
          <div className="inline-block p-4 bg-white rounded-3xl shadow-lg">
            <Sparkles className="text-sky-blue mx-auto" size={48} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-balance">
            <span className="bg-gradient-to-r from-sky-blue to-deep-blue bg-clip-text text-transparent">
              Gotas de Vida
            </span>
          </h1>
          <p className="text-base sm:text-lg text-foreground/80 text-pretty px-2">
            Descubre la magia de la lactancia materna
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-xl">
          <p className="text-sm sm:text-base text-foreground/90 leading-relaxed text-pretty">
            Aprende sobre los beneficios de la lactancia materna a través de juegos interactivos y divertidos. Gana
            estrellas, desbloquea logros y conviértete en una experta.
          </p>
        </div>

        <div className="flex flex-col gap-3 px-4">
          <Button asChild size="lg" className="text-base px-6 py-5 rounded-2xl shadow-lg w-full">
            <Link href="/auth/sign-up">
              <Sparkles className="mr-2" size={18} />
              Comenzar Aventura
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="text-base px-6 py-5 rounded-2xl border-2 bg-white/50 backdrop-blur-sm w-full"
          >
            <Link href="/auth/login">Iniciar Sesión</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 pt-4 px-2">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 space-y-2">
            <Star className="text-soft-gold mx-auto" size={28} />
            <h3 className="font-semibold text-sm text-foreground">Gana Estrellas</h3>
            <p className="text-xs text-muted-foreground text-pretty">Completa niveles y acumula puntos</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 space-y-2">
            <Sparkles className="text-pastel-pink mx-auto" size={28} />
            <h3 className="font-semibold text-sm text-foreground">Aprende Jugando</h3>
            <p className="text-xs text-muted-foreground text-pretty">Juegos de arrastrar y soltar</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 space-y-2">
            <Heart className="text-sky-blue mx-auto" size={28} />
            <h3 className="font-semibold text-sm text-foreground">Desbloquea Logros</h3>
            <p className="text-xs text-muted-foreground text-pretty">Conviértete en experta</p>
          </div>
        </div>
      </main>
    </div>
  )
}

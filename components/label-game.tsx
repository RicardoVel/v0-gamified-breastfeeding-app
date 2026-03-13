"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Star, X, Sparkles, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { MusicControl } from "@/components/music-control"

interface LabelZone {
  id: string
  label: string
  /** Position as percentage from top-left of the image */
  x: number
  y: number
  feedback: string
}

interface LabelGameProps {
  levelId: number
  userId: string
  title: string
  question: string
  diagramImage: string
  zones: LabelZone[]
  backgroundImage?: string
  mascotImage?: string
}

interface FeedbackState {
  message: string
  isCorrect: boolean
  visible: boolean
}

export function LabelGame({
  levelId,
  userId,
  title,
  question,
  diagramImage,
  zones,
  backgroundImage,
  mascotImage = "/images/mascota-gota.png",
}: LabelGameProps) {
  const router = useRouter()
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const [placedLabels, setPlacedLabels] = useState<Record<string, string>>({})
  const [correctZones, setCorrectZones] = useState<Set<string>>(new Set())
  const [incorrectAttempt, setIncorrectAttempt] = useState<string | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [stars, setStars] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [mistakes, setMistakes] = useState(0)
  const [feedback, setFeedback] = useState<FeedbackState>({ message: "", isCorrect: false, visible: false })
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Shuffle available labels
  const shuffledLabels = useMemo(() => {
    return [...zones].sort(() => Math.random() - 0.5)
  }, [zones])

  // Labels not yet correctly placed
  const availableLabels = shuffledLabels.filter((z) => !correctZones.has(z.id))

  const showFeedback = (message: string, isCorrect: boolean) => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
    setFeedback({ message, isCorrect, visible: true })
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback((prev) => ({ ...prev, visible: false }))
    }, 11000)
  }

  const handleLabelTap = (label: string) => {
    if (correctZones.size === zones.length) return
    setSelectedLabel(selectedLabel === label ? null : label)
  }

  const handleZoneTap = (zoneId: string) => {
    if (!selectedLabel || correctZones.has(zoneId)) return

    const zone = zones.find((z) => z.id === zoneId)
    if (!zone) return

    if (selectedLabel === zone.label) {
      // Correct!
      const newCorrect = new Set(correctZones)
      newCorrect.add(zoneId)
      setCorrectZones(newCorrect)
      setPlacedLabels((prev) => ({ ...prev, [zoneId]: zone.label }))
      setSelectedLabel(null)
      showFeedback(zone.feedback, true)

      // Check if game is finished
      if (newCorrect.size === zones.length) {
        setTimeout(() => finishGame(newCorrect.size), 5000)
      }
    } else {
      // Incorrect
      setMistakes((prev) => prev + 1)
      setIncorrectAttempt(zoneId)
      showFeedback(`Esa etiqueta no corresponde aqui. Intenta con otra zona.`, false)
      setTimeout(() => setIncorrectAttempt(null), 800)
    }
  }

  const finishGame = async (totalCorrect?: number) => {
    const correct = totalCorrect ?? correctZones.size
    const total = zones.length
    let earnedStars = 0
    if (mistakes === 0 && correct === total) earnedStars = 3
    else if (mistakes <= 2 && correct === total) earnedStars = 2
    else if (correct === total) earnedStars = 1

    setStars(earnedStars)
    setIsCompleted(true)
    setIsSaving(true)

    const supabase = createClient()

    try {
      const { data: previousBest } = await supabase
        .from("game_progress")
        .select("stars_earned")
        .eq("user_id", userId)
        .eq("level", levelId)
        .eq("game_type", "label")
        .order("stars_earned", { ascending: false })
        .limit(1)
        .single()

      const previousStars = previousBest?.stars_earned || 0
      const starsToAdd = earnedStars > previousStars ? earnedStars - previousStars : 0

      if (starsToAdd > 0) {
        const { data: userData } = await supabase
          .from("users")
          .select("total_stars, experience_points, level")
          .eq("id", userId)
          .single()

        if (userData) {
          const newXP = userData.experience_points + starsToAdd * 10
          const newLevel = Math.floor(newXP / 30) + 1
          await supabase.from("users").update({
            total_stars: userData.total_stars + starsToAdd,
            experience_points: newXP,
            level: newLevel,
          }).eq("id", userId)
        }
      }

      await supabase.from("game_progress").insert({
        user_id: userId,
        game_type: "label",
        level: levelId,
        stars_earned: earnedStars,
        completed: true,
        completed_at: new Date().toISOString(),
      })

      if (earnedStars === 3 && previousStars < 3) {
        await supabase.from("achievements").insert({
          user_id: userId,
          achievement_type: `level_${levelId}_perfect`,
        })
      }
    } catch (error) {
      console.error("[v0] Error saving label game progress:", error)
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
    }
  }, [])

  // Audio de victoria al completar y luego musica dreamy
  useEffect(() => {
    if (isCompleted) {
      const victoryAudio = new Audio("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sfx-victory7-jHKGu3MQl9lG65N9zcekGjBG4ciAHD.mp3")
      victoryAudio.volume = 0.5
      victoryAudio.play().catch(() => {})
      
      // Despues de que termine el audio de victoria, reproducir musica dreamy
      victoryAudio.onended = () => {
        const dreamyAudio = new Audio("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/goldensoundlabs-colors-everywhere-on-earth-dreamy-opening-497549-IFrwDFwXUkq0ZCNS3h0PAsqZs2H6P7.mp3")
        dreamyAudio.volume = 0.3
        dreamyAudio.loop = true
        dreamyAudio.play().catch(() => {})
      }
    }
  }, [isCompleted])

  // Completed screen
  if (isCompleted) {
    const resultVideo = stars === 3 
      ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Correcto-WXeL1iSGFJyPKhloZcnaBFCs1sTwOB.mp4"
      : stars === 2
        ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Motivacional-jRBnvgVOsKwmDNVvR2KbmmSX5V4rq5.mp4"
        : "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Incorrecto-KhdBIWT7AgzchzRYRJGn4Et8VHXs8a.mp4"
    
    const resultMessage = stars === 3
      ? "Lo hiciste muy bien! Haz ganado una gotita de vida."
      : stars === 2
        ? "Sigue asi! Conocer las partes del agarre correcto es fundamental para una lactancia exitosa."
        : "Cada error es como una semilla: pronto florecera en conocimiento."
    
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={backgroundImage ? {
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        } : undefined}
      >
        <Card className="max-w-sm w-full rounded-3xl p-6 shadow-xl text-center space-y-4 bg-white/95 backdrop-blur-sm">
          <Sparkles className="text-soft-gold mx-auto" size={48} />
          <h2 className="text-2xl font-bold text-foreground">Nivel Completado</h2>
          <p className="text-sm text-muted-foreground">
            Identificaste las {zones.length} partes del agarre correcto
            {mistakes === 0 ? " sin ningun error." : ` con ${mistakes} intento${mistakes > 1 ? "s" : ""} fallido${mistakes > 1 ? "s" : ""}.`}
          </p>

          {/* Video de animacion */}
          <div className="flex justify-center">
            <video
              src={resultVideo}
              autoPlay
              loop
              muted
              playsInline
              className="w-40 h-40 object-contain"
            />
          </div>

          {/* Frase motivacional */}
          <p className="text-sm font-semibold text-violet-600 px-2">
            {resultMessage}
          </p>

          <div className="flex justify-center gap-2">
            {[1, 2, 3].map((i) => (
              <Star key={i} size={40} className={i <= stars ? "text-soft-gold fill-soft-gold" : "text-muted"} />
            ))}
          </div>

          <div className="space-y-2 pt-2">
            <Button onClick={() => router.push("/game")} className="w-full rounded-xl" disabled={isSaving}>
              Volver a Niveles
            </Button>
            <Button onClick={() => router.push("/profile")} variant="outline" className="w-full rounded-xl bg-transparent">
              Ver Mi Perfil
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen p-2 sm:p-3 md:p-6 overflow-x-hidden"
      style={backgroundImage ? {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      } : undefined}
    >
      <MusicControl track="amber" volume={0.25} />
      <div className="max-w-lg mx-auto space-y-3 w-full">

        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
          <p className="text-xs text-muted-foreground">{question}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-500"
                style={{ width: `${(correctZones.size / zones.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {correctZones.size} / {zones.length}
            </span>
          </div>
        </div>

        {/* Diagram with Drop Zones */}
        <Card className="rounded-2xl overflow-hidden shadow-lg bg-white/95 backdrop-blur-sm p-2">
          <p className="text-center text-xs font-semibold mb-2 text-muted-foreground">
            {selectedLabel ? `Toca la zona correcta para: "${selectedLabel}"` : "Selecciona una etiqueta de abajo"}
          </p>
          <div className="relative w-full" style={{ aspectRatio: "1 / 1" }}>
            <Image
              src={diagramImage}
              alt="Diagrama de agarre correcto"
              fill
              className="object-cover rounded-xl"
              priority
            />

            {/* Drop zones as circular hotspots */}
            {zones.map((zone) => {
              const isPlaced = correctZones.has(zone.id)
              const isIncorrect = incorrectAttempt === zone.id
              const isActive = selectedLabel && !isPlaced

              return (
                <button
                  key={zone.id}
                  onClick={() => handleZoneTap(zone.id)}
                  disabled={isPlaced || !selectedLabel}
                  className={`absolute flex items-center justify-center transition-all duration-300 rounded-full ${
                    isPlaced
                      ? "bg-green-500/80 border-2 border-green-400 shadow-lg shadow-green-300/40"
                      : isIncorrect
                        ? "bg-red-400/70 border-2 border-red-500 animate-shake"
                        : isActive
                          ? "bg-sky-400/40 border-2 border-sky-400 border-dashed animate-pulse cursor-pointer"
                          : "bg-white/30 border-2 border-white/50 border-dashed"
                  }`}
                  style={{
                    left: `${zone.x}%`,
                    top: `${zone.y}%`,
                    transform: "translate(-50%, -50%)",
                    width: "clamp(40px, 12vw, 56px)",
                    height: "clamp(40px, 12vw, 56px)",
                  }}
                >
                  {isPlaced ? (
                    <Check size={20} className="text-white" strokeWidth={3} />
                  ) : (
                    <span className="text-white font-bold text-lg">?</span>
                  )}
                </button>
              )
            })}

            {/* Placed labels shown on the image */}
            {zones.filter((z) => correctZones.has(z.id)).map((zone) => (
              <div
                key={`label-${zone.id}`}
                className="absolute bg-green-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap pointer-events-none"
                style={{
                  left: `${zone.x}%`,
                  top: `${zone.y + 8}%`,
                  transform: "translate(-50%, 0)",
                }}
              >
                {zone.label}
              </div>
            ))}
          </div>
        </Card>

        {/* Feedback Mascot */}
        {feedback.visible && (
          <div className={`flex items-start gap-3 p-3 rounded-2xl shadow-lg animate-in slide-in-from-top-4 duration-300 ${
            feedback.isCorrect ? "bg-green-50 border-2 border-green-300" : "bg-red-50 border-2 border-red-300"
          }`}>
            <Image src={mascotImage} alt="Mascota" width={55} height={55} className="object-contain flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold mb-0.5 ${feedback.isCorrect ? "text-green-700" : "text-red-700"}`}>
                {feedback.isCorrect ? "Correcto!" : "Intenta de nuevo"}
              </p>
              <p className={`text-xs leading-relaxed ${feedback.isCorrect ? "text-green-600" : "text-red-600"}`}>
                {feedback.message}
              </p>
            </div>
            <button onClick={() => setFeedback((p) => ({ ...p, visible: false }))} className="flex-shrink-0 p-1 rounded-full hover:bg-black/10">
              <X size={14} className="text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Available labels to pick from */}
        {availableLabels.length > 0 && (
          <Card className="rounded-2xl p-3 shadow-lg bg-white/95 backdrop-blur-sm">
            <p className="text-sm font-semibold mb-2 text-center text-foreground">
              Etiquetas disponibles
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {availableLabels.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => handleLabelTap(zone.label)}
                  className={`px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all active:scale-95 ${
                    selectedLabel === zone.label
                      ? "border-sky-500 bg-sky-50 ring-2 ring-sky-400 text-sky-700 scale-105 shadow-lg"
                      : "border-sky-200 bg-white text-foreground hover:border-sky-400 hover:bg-sky-50"
                  }`}
                >
                  {zone.label}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Exit button */}
        <div className="flex gap-2">
          <Button onClick={() => router.push("/game")} variant="outline" className="rounded-xl px-4 bg-white/90 flex-1">
            Salir
          </Button>
        </div>

      </div>
    </div>
  )
}

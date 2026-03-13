"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Star, X, Sparkles, ArrowUp, ArrowDown, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { MusicControl } from "@/components/music-control"

interface OrderStep {
  id: string
  text: string
  correctOrder: number
  feedback: string
}

interface OrderStepsGameProps {
  levelId: number
  userId: string
  title: string
  question: string
  steps: OrderStep[]
  backgroundImage?: string
  mascotImage?: string
}

interface FeedbackState {
  message: string
  isCorrect: boolean
  visible: boolean
}

export function OrderStepsGame({
  levelId,
  userId,
  title,
  question,
  steps,
  backgroundImage,
  mascotImage = "/images/mascota-gota.png",
}: OrderStepsGameProps) {
  const router = useRouter()
  const [isCompleted, setIsCompleted] = useState(false)
  const [stars, setStars] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>({ message: "", isCorrect: false, visible: false })
  const [attempts, setAttempts] = useState(0)
  const [hasChecked, setHasChecked] = useState(false)
  const [correctPositions, setCorrectPositions] = useState<Record<string, boolean>>({})
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Shuffle steps initially
  const [orderedSteps, setOrderedSteps] = useState<OrderStep[]>(() => {
    const shuffled = [...steps]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  })

  const showFeedback = (message: string, isCorrect: boolean) => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current)
    }
    setFeedback({ message, isCorrect, visible: true })
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback((prev) => ({ ...prev, visible: false }))
    }, 10000)
  }

  const moveStep = (index: number, direction: "up" | "down") => {
    if (hasChecked) return
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= orderedSteps.length) return

    const newSteps = [...orderedSteps];
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]]
    setOrderedSteps(newSteps)
  }

  const checkOrder = () => {
    setAttempts((prev) => prev + 1)
    setHasChecked(true)

    // Check each position
    const positions: Record<string, boolean> = {}
    let allCorrect = true
    for (let i = 0; i < orderedSteps.length; i++) {
      const isCorrect = orderedSteps[i].correctOrder === i + 1
      positions[orderedSteps[i].id] = isCorrect
      if (!isCorrect) allCorrect = false
    }
    setCorrectPositions(positions)

    if (allCorrect) {
      // All correct - build feedback with all steps
      const allFeedback = orderedSteps.map((s, i) => `${i + 1}. ${s.text}: ${s.feedback}`).join("\n\n")
      showFeedback("¡Excelente! El orden es perfecto. " + orderedSteps[0].feedback, true)
      setTimeout(() => finishGame(), 2000)
    } else {
      const wrongCount = Object.values(positions).filter((v) => !v).length
      showFeedback(
        `${wrongCount} paso${wrongCount > 1 ? "s" : ""} en posicion incorrecta. Revisa las tarjetas marcadas en rojo e intenta de nuevo.`,
        false
      )
      // Allow retry after a moment
      setTimeout(() => {
        setHasChecked(false)
        setCorrectPositions({})
      }, 2500)
    }
  }

  const finishGame = async () => {
    let earnedStars = 0
    if (attempts <= 1) earnedStars = 3
    else if (attempts <= 2) earnedStars = 2
    else earnedStars = 1

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
        .eq("game_type", "order")
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

          await supabase
            .from("users")
            .update({
              total_stars: userData.total_stars + starsToAdd,
              experience_points: newXP,
              level: newLevel,
            })
            .eq("id", userId)
        }
      }

      await supabase.from("game_progress").insert({
        user_id: userId,
        game_type: "order",
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
      console.error("Error saving progress:", error)
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current)
      }
    }
  }, [])

  // Audio de victoria al completar
  useEffect(() => {
    if (isCompleted) {
      const audio = new Audio("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sfx-victory7-jHKGu3MQl9lG65N9zcekGjBG4ciAHD.mp3")
      audio.volume = 0.5
      audio.play().catch(() => {})
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
        ? "Sigue asi! Conocer el orden correcto de los pasos es esencial para una buena tecnica."
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
            Ordenaste los pasos en {attempts} intento{attempts !== 1 ? "s" : ""}
          </p>

          {/* Show correct order */}
          <div className="text-left space-y-2 bg-emerald-50 rounded-xl p-3 max-h-28 overflow-y-auto">
            <p className="text-xs font-bold text-emerald-700 mb-2">Orden correcto:</p>
            {steps
              .sort((a, b) => a.correctOrder - b.correctOrder)
              .map((step) => (
                <div key={step.id} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">
                    {step.correctOrder}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-emerald-800">{step.text}</p>
                    <p className="text-xs text-emerald-600 leading-relaxed">{step.feedback}</p>
                  </div>
                </div>
              ))}
          </div>

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
      <MusicControl track="velvet" volume={0.25} />
      <div className="max-w-lg mx-auto space-y-3 w-full">

        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
          <p className="text-xs text-muted-foreground">{question}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-muted-foreground">Intentos: {attempts}</span>
          </div>
        </div>

        {/* Instruction */}
        <div className="flex items-start gap-3 bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
          <Image src={mascotImage} alt="Mascota" width={50} height={50} className="object-contain flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Ordena los pasos</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Usa las flechas para mover las tarjetas hacia arriba o abajo hasta que esten en el orden correcto. Luego presiona &quot;Verificar orden&quot;.
            </p>
          </div>
        </div>

        {/* Feedback */}
        {feedback.visible && (
          <div className={`flex items-start gap-3 p-3 rounded-2xl shadow-lg animate-in slide-in-from-top-4 duration-300 ${
            feedback.isCorrect ? "bg-green-50 border-2 border-green-300" : "bg-red-50 border-2 border-red-300"
          }`}>
            <Image src={mascotImage} alt="Mascota" width={50} height={50} className="object-contain flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold mb-0.5 ${feedback.isCorrect ? "text-green-700" : "text-red-700"}`}>
                {feedback.isCorrect ? "Perfecto!" : "Revisa el orden"}
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

        {/* Step Cards */}
        <div className="space-y-2">
          {orderedSteps.map((step, index) => {
            const positionStatus = correctPositions[step.id]
            const isCorrectPos = positionStatus === true
            const isWrongPos = positionStatus === false

            return (
              <div
                key={step.id}
                className={`flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-lg border-2 transition-all duration-300 ${
                  isCorrectPos
                    ? "border-green-400 bg-green-50/95 ring-2 ring-green-300"
                    : isWrongPos
                    ? "border-red-400 bg-red-50/95 ring-2 ring-red-300 animate-shake"
                    : "border-transparent"
                }`}
              >
                {/* Position number */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  isCorrectPos
                    ? "bg-green-500 text-white"
                    : isWrongPos
                    ? "bg-red-500 text-white"
                    : "bg-teal-500 text-white"
                }`}>
                  {index + 1}
                </div>

                {/* Step text */}
                <p className="flex-1 text-sm font-medium text-foreground leading-tight">{step.text}</p>

                {/* Arrow buttons */}
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    onClick={() => moveStep(index, "up")}
                    disabled={index === 0 || hasChecked}
                    className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-teal-200 active:bg-teal-300 transition-colors"
                    aria-label="Mover arriba"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => moveStep(index, "down")}
                    disabled={index === orderedSteps.length - 1 || hasChecked}
                    className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-teal-200 active:bg-teal-300 transition-colors"
                    aria-label="Mover abajo"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>

                {/* Status icon */}
                {isCorrectPos && (
                  <Check size={20} className="text-green-600 flex-shrink-0" />
                )}
                {isWrongPos && (
                  <X size={20} className="text-red-600 flex-shrink-0" />
                )}
              </div>
            )
          })}
        </div>

        {/* Verify button */}
        <Button
          onClick={checkOrder}
          disabled={hasChecked}
          className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-base font-bold py-5 shadow-lg"
        >
          <Check size={20} className="mr-2" />
          Verificar orden
        </Button>

        {/* Exit button */}
        <Button onClick={() => router.push("/game")} variant="outline" className="w-full rounded-xl bg-white/90">
          Salir
        </Button>

      </div>
    </div>
  )
}

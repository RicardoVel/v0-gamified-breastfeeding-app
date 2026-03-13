"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Star, X, ChevronRight, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { MusicControl } from "@/components/music-control"

interface MatchingPair {
  name: string
  image: string
  feedback: string
}

interface MatchingGameProps {
  levelId: number
  userId: string
  title: string
  question: string
  pairs: MatchingPair[]
  backgroundImage?: string
  mascotImage?: string
}

interface FeedbackState {
  message: string
  isCorrect: boolean
  visible: boolean
}

export function MatchingGame({
  levelId,
  userId,
  title,
  question,
  pairs,
  backgroundImage,
  mascotImage = "/images/mascota-gota.png",
}: MatchingGameProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [stars, setStars] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>({ message: "", isCorrect: false, visible: false })
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Shuffle the order of pairs for the game
  const shuffledPairs = useMemo(() => {
    return [...pairs].sort(() => Math.random() - 0.5)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentPair = shuffledPairs[currentIndex]

  // Generate shuffled options for the current question (all names shuffled)
  const currentOptions = useMemo(() => {
    const allNames = shuffledPairs.map((p) => p.name)
    return [...allNames].sort(() => Math.random() - 0.5)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex])

  const showFeedback = (message: string, isCorrect: boolean) => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current)
    }
    setFeedback({ message, isCorrect, visible: true })
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback((prev) => ({ ...prev, visible: false }))
    }, 11000)
  }

  const handleSelectOption = (name: string) => {
    if (hasAnswered) return
    setSelectedOption(name)
    setHasAnswered(true)

    const isCorrect = name === currentPair.name
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1)
    }
    showFeedback(
      isCorrect
        ? currentPair.feedback
        : `La respuesta correcta es "${currentPair.name}". ${currentPair.feedback}`,
      isCorrect
    )
  }

  const handleNext = () => {
    setFeedback((prev) => ({ ...prev, visible: false }))
    setSelectedOption(null)
    setHasAnswered(false)

    if (currentIndex + 1 >= shuffledPairs.length) {
      finishGame()
    } else {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const finishGame = async () => {
    const total = shuffledPairs.length
    const finalCorrect = correctCount
    let earnedStars = 0
    if (finalCorrect === total) earnedStars = 3
    else if (finalCorrect >= total * 0.75) earnedStars = 2
    else if (finalCorrect >= total * 0.5) earnedStars = 1

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
        .eq("game_type", "matching")
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
        game_type: "matching",
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
      console.error("[v0] Error saving progress:", error)
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
    const finalCorrect = correctCount
    const resultVideo = stars === 3 
      ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Correcto-WXeL1iSGFJyPKhloZcnaBFCs1sTwOB.mp4"
      : stars === 2
        ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Motivacional-jRBnvgVOsKwmDNVvR2KbmmSX5V4rq5.mp4"
        : "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Incorrecto-KhdBIWT7AgzchzRYRJGn4Et8VHXs8a.mp4"
    
    const resultMessage = stars === 3
      ? "Lo hiciste muy bien! Haz ganado una gotita de vida."
      : stars === 2
        ? "Sigue asi! Reconocer las posiciones de lactancia te ayudara a apoyar mejor a las mamas."
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
          <h2 className="text-2xl font-bold">Nivel Completado</h2>
          <p className="text-sm text-muted-foreground">
            Identificaste {finalCorrect} de {shuffledPairs.length} posiciones correctamente
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
            <Button onClick={() => router.push("/profile")} variant="outline" className="w-full rounded-xl">
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
      <MusicControl track="nature" volume={0.25} />
      <div className="max-w-lg mx-auto space-y-3 w-full">

        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
          <p className="text-xs text-muted-foreground">{question}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-500"
                style={{ width: `${((currentIndex) / shuffledPairs.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {currentIndex + 1} / {shuffledPairs.length}
            </span>
          </div>
        </div>

        {/* Position Image */}
        <Card className="rounded-2xl overflow-hidden shadow-lg bg-white/95 backdrop-blur-sm p-4">
          <p className="text-center text-sm font-semibold mb-3 text-foreground">
            Que posicion de lactancia es esta?
          </p>
          <div className="flex justify-center">
            <div className="relative rounded-2xl overflow-hidden shadow-md border-2 border-sky-200">
              <Image
                src={currentPair.image}
                alt="Posicion de lactancia"
                width={280}
                height={280}
                className="object-cover"
                priority
              />
            </div>
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
                {feedback.isCorrect ? "Correcto!" : "No es esa posicion"}
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

        {/* Options */}
        <Card className="rounded-2xl p-3 shadow-lg bg-white/95 backdrop-blur-sm">
          <p className="text-sm font-semibold mb-2 text-center text-foreground">
            {hasAnswered ? "Toca 'Siguiente' para continuar" : "Selecciona el nombre correcto"}
          </p>
          <div className="grid grid-cols-1 gap-2">
            {currentOptions.map((name) => {
              const isSelected = selectedOption === name
              const isCorrectAnswer = name === currentPair.name

              let optionStyle = "border-sky-200 bg-white hover:bg-sky-50 hover:border-sky-400"
              if (hasAnswered) {
                if (isCorrectAnswer) {
                  optionStyle = "border-green-400 bg-green-50 ring-2 ring-green-300"
                } else if (isSelected && !isCorrectAnswer) {
                  optionStyle = "border-red-400 bg-red-50 ring-2 ring-red-300"
                } else {
                  optionStyle = "border-muted bg-muted/30 opacity-50"
                }
              }

              return (
                <button
                  key={name}
                  onClick={() => handleSelectOption(name)}
                  disabled={hasAnswered}
                  className={`text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${optionStyle} ${
                    !hasAnswered ? "active:scale-[0.98]" : ""
                  }`}
                >
                  <span className="text-foreground">{name}</span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Next / Exit buttons */}
        <div className="flex gap-2">
          {hasAnswered && (
            <Button onClick={handleNext} className="flex-1 rounded-xl py-5 text-base gap-2">
              {currentIndex + 1 >= shuffledPairs.length ? "Ver Resultados" : "Siguiente"}
              <ChevronRight size={18} />
            </Button>
          )}
          <Button onClick={() => router.push("/game")} variant="outline" className="rounded-xl px-4 bg-white/90">
            Salir
          </Button>
        </div>

      </div>
    </div>
  )
}

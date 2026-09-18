"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Star, X, Sparkles, Check, ThumbsUp, ThumbsDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { MusicControl } from "@/components/music-control"
import { audioManager } from "@/lib/audio-manager"

interface TFStatement {
  id: string
  text: string
  isTrue: boolean
  feedback: string
}

interface TrueFalseGameProps {
  levelId: number
  userId: string
  title: string
  question: string
  statements: TFStatement[]
  backgroundImage?: string
  mascotImage?: string
}

interface FeedbackState {
  message: string
  isCorrect: boolean
  visible: boolean
}

export function TrueFalseGame({
  levelId,
  userId,
  title,
  question,
  statements,
  backgroundImage,
  mascotImage = "/images/mascota-gota.png",
}: TrueFalseGameProps) {
  const router = useRouter()
  const [isCompleted, setIsCompleted] = useState(false)
  const [stars, setStars] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>({ message: "", isCorrect: false, visible: false })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null)
  const [shuffledStatements] = useState<TFStatement[]>(() => {
    const shuffled = [...statements]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  })
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const currentStatement = shuffledStatements[currentIndex]
  const totalStatements = shuffledStatements.length

  const showFeedback = (message: string, isCorrect: boolean) => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current)
    }
    setFeedback({ message, isCorrect, visible: true })
  }

  const handleAnswer = (answer: boolean) => {
    if (hasAnswered) return
    setHasAnswered(true)
    setSelectedAnswer(answer)

    const isCorrect = answer === currentStatement.isTrue
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1)
    }

    const correctLabel = currentStatement.isTrue ? "Verdadero" : "Falso"
    showFeedback(
      `${isCorrect ? "Correcto!" : `Incorrecto. La respuesta es: ${correctLabel}.`} ${currentStatement.feedback}`,
      isCorrect
    )
  }

  const nextStatement = () => {
    setFeedback((prev) => ({ ...prev, visible: false }))
    setHasAnswered(false)
    setSelectedAnswer(null)

    if (currentIndex + 1 < totalStatements) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      finishGame()
    }
  }

  const finishGame = async () => {
    const finalCorrect = correctCount
    let earnedStars = 0
    if (finalCorrect === totalStatements) earnedStars = 3
    else if (finalCorrect >= totalStatements * 0.8) earnedStars = 2
    else if (finalCorrect >= totalStatements * 0.5) earnedStars = 1

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
        .eq("game_type", "truefalse")
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
        game_type: "truefalse",
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

  // Audio de victoria al completar y luego musica dreamy
  useEffect(() => {
    if (isCompleted) {
      audioManager.playVictoryThenDreamy()
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
        ? "Sigue asi! Distinguir entre mitos y verdades es clave para apoyar la lactancia."
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
            Acertaste {correctCount} de {totalStatements} frases
          </p>

          {/* Summary */}
          <div className="text-left space-y-2 max-h-32 overflow-y-auto bg-amber-50 rounded-xl p-3">
            <p className="text-xs font-bold text-amber-800 mb-2">Repaso de respuestas:</p>
            {shuffledStatements.map((stmt) => (
              <div key={stmt.id} className="flex items-start gap-2 pb-2 border-b border-amber-100 last:border-0">
                <span className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${
                  stmt.isTrue ? "bg-emerald-500" : "bg-red-500"
                }`}>
                  {stmt.isTrue ? <Check size={12} /> : <X size={12} />}
                </span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{stmt.text}</p>
                  <p className="text-xs text-amber-700 font-medium">
                    {stmt.isTrue ? "Verdadero" : "Falso"}
                  </p>
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
      <MusicControl track="tranquil" volume={0.25} />
      <div className="max-w-lg mx-auto space-y-4 w-full">

        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
          <p className="text-xs text-muted-foreground">{question}</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-muted-foreground">
              Pregunta {currentIndex + 1} de {totalStatements}
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              {correctCount} correcta{correctCount !== 1 ? "s" : ""}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${((currentIndex) / totalStatements) * 100}%` }}
            />
          </div>
        </div>

        {/* Statement Card */}
        <div className="relative">
          <Card className={`rounded-3xl p-6 shadow-xl border-2 transition-all duration-500 ${
            hasAnswered
              ? selectedAnswer === currentStatement.isTrue
                ? "border-emerald-400 bg-emerald-50/95"
                : "border-red-400 bg-red-50/95"
              : "border-transparent bg-white/95 backdrop-blur-sm"
          }`}>
            {/* Floating quote marks */}
            <div className="text-6xl font-serif text-teal-200 leading-none select-none">{'\u201C'}</div>

            {/* Statement text */}
            <p className="text-lg font-bold text-foreground text-center px-2 -mt-4 mb-6 leading-snug text-balance">
              {currentStatement.text}
            </p>

            <div className="text-6xl font-serif text-teal-200 leading-none text-right select-none -mt-2">{'\u201D'}</div>

            {/* Answer status badge */}
            {hasAnswered && (
              <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${
                selectedAnswer === currentStatement.isTrue
                  ? "bg-emerald-500 text-white"
                  : "bg-red-500 text-white"
              }`}>
                {selectedAnswer === currentStatement.isTrue ? "Correcto" : "Incorrecto"}
              </div>
            )}
          </Card>
        </div>

        {/* True/False Buttons */}
        {!hasAnswered ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleAnswer(true)}
              className="flex flex-col items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-2xl p-5 shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <ThumbsUp size={32} />
              <span className="text-base font-bold">Verdadero</span>
            </button>
            <button
              onClick={() => handleAnswer(false)}
              className="flex flex-col items-center gap-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-2xl p-5 shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <ThumbsDown size={32} />
              <span className="text-base font-bold">Falso</span>
            </button>
          </div>
        ) : (
          <Button
            onClick={nextStatement}
            className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-base font-bold py-5 shadow-lg"
          >
            {currentIndex + 1 < totalStatements ? "Siguiente frase" : "Ver Resultados"}
          </Button>
        )}

        {/* Feedback */}
        {feedback.visible && (
          <div className={`flex items-start gap-3 p-3 rounded-2xl shadow-lg animate-in slide-in-from-bottom-4 duration-300 ${
            feedback.isCorrect ? "bg-green-50 border-2 border-green-300" : "bg-red-50 border-2 border-red-300"
          }`}>
            <Image src={mascotImage} alt="Mascota" width={50} height={50} className="object-contain flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold mb-0.5 ${feedback.isCorrect ? "text-green-700" : "text-red-700"}`}>
                {feedback.isCorrect ? "Muy bien!" : "Saber es poder"}
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

        {/* Exit button */}
        <Button onClick={() => router.push("/game")} variant="outline" className="w-full rounded-xl bg-white/90">
          Salir
        </Button>

      </div>
    </div>
  )
}

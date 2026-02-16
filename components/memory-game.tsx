"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Star, X, Sparkles, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"

interface MemoryPair {
  id: string
  text: string
  image: string
  feedback: string
}

interface MemoryGameProps {
  levelId: number
  userId: string
  title: string
  question: string
  pairs: MemoryPair[]
  backgroundImage?: string
  mascotImage?: string
}

interface FeedbackState {
  message: string
  isCorrect: boolean
  visible: boolean
}

type CardType = {
  id: string
  pairId: string
  type: "text" | "image"
  content: string
  isFlipped: boolean
  isMatched: boolean
}

export function MemoryGame({
  levelId,
  userId,
  title,
  question,
  pairs,
  backgroundImage,
  mascotImage = "/images/mascota-gota.png",
}: MemoryGameProps) {
  const router = useRouter()
  const [isCompleted, setIsCompleted] = useState(false)
  const [stars, setStars] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>({ message: "", isCorrect: false, visible: false })
  const [attempts, setAttempts] = useState(0)
  const [matchedCount, setMatchedCount] = useState(0)
  const [firstCard, setFirstCard] = useState<CardType | null>(null)
  const [secondCard, setSecondCard] = useState<CardType | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [freeFlipsLeft, setFreeFlipsLeft] = useState(3)
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Create shuffled cards: for each pair, one text card and one image card
  const [cards, setCards] = useState<CardType[]>(() => {
    const allCards: CardType[] = []
    for (const pair of pairs) {
      allCards.push({
        id: `${pair.id}-text`,
        pairId: pair.id,
        type: "text",
        content: pair.text,
        isFlipped: false,
        isMatched: false,
      })
      allCards.push({
        id: `${pair.id}-image`,
        pairId: pair.id,
        type: "image",
        content: pair.image,
        isFlipped: false,
        isMatched: false,
      })
    }
    // Shuffle
    for (let i = allCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCards[i], allCards[j]] = [allCards[j], allCards[i]]
    }
    return allCards
  })

  const totalPairs = pairs.length

  const showFeedback = (message: string, isCorrect: boolean) => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current)
    }
    setFeedback({ message, isCorrect, visible: true })
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback((prev) => ({ ...prev, visible: false }))
    }, 5000)
  }

  const handleCardClick = (card: CardType) => {
    if (isChecking || card.isFlipped || card.isMatched) return

    // Flip the card
    setCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, isFlipped: true } : c))
    )

    if (!firstCard) {
      setFirstCard(card)
    } else if (!secondCard) {
      setSecondCard(card)
      setIsChecking(true)
      // Solo contar intento si ya no quedan giros de cortesia
      if (freeFlipsLeft <= 0) {
        setAttempts((prev) => prev + 1)
      } else {
        setFreeFlipsLeft((prev) => prev - 1)
      }
    }
  }

  // Check for match when two cards are selected
  useEffect(() => {
    if (!firstCard || !secondCard) return

    const isMatch = firstCard.pairId === secondCard.pairId

    const timer = setTimeout(() => {
      if (isMatch) {
        // Mark both as matched
        setCards((prev) =>
          prev.map((c) =>
            c.pairId === firstCard.pairId ? { ...c, isMatched: true, isFlipped: true } : c
          )
        )
        const newMatched = matchedCount + 1
        setMatchedCount(newMatched)

        const matchedPair = pairs.find((p) => p.id === firstCard.pairId)
        if (matchedPair) {
          showFeedback(matchedPair.feedback, true)
        }

        // Check if game is complete
        if (newMatched === totalPairs) {
          setTimeout(() => finishGame(newMatched, attempts), 1500)
        }
      } else {
        // Flip both back
        setCards((prev) =>
          prev.map((c) =>
            c.id === firstCard.id || c.id === secondCard.id
              ? { ...c, isFlipped: false }
              : c
          )
        )
        showFeedback("No es la pareja correcta. Intenta de nuevo.", false)
      }

      setFirstCard(null)
      setSecondCard(null)
      setIsChecking(false)
    }, 1000)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstCard, secondCard])

  const finishGame = async (finalMatched: number, totalAttempts: number) => {
    // Stars based on efficiency: fewer attempts = more stars
    // Perfect: totalPairs attempts (each guess is correct) = 3 stars
    // Good: up to 2x the pairs = 2 stars
    // Okay: more than 2x = 1 star
    let earnedStars = 0
    if (totalAttempts <= totalPairs + 1) earnedStars = 3
    else if (totalAttempts <= totalPairs * 2) earnedStars = 2
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
        .eq("game_type", "memory")
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
        game_type: "memory",
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

  // Completed screen
  if (isCompleted) {
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
            Encontraste {matchedCount} parejas en {attempts} intentos
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
      className="min-h-screen p-3 md:p-6"
      style={backgroundImage ? {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      } : undefined}
    >
      <div className="max-w-lg mx-auto space-y-3">

        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
          <p className="text-xs text-muted-foreground">{question}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-500"
                style={{ width: `${(matchedCount / totalPairs) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {matchedCount} / {totalPairs}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2">
              <RotateCcw size={12} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Intentos: {attempts}</span>
            </div>
            {freeFlipsLeft > 0 && (
              <span className="text-xs font-semibold text-sky-600 bg-sky-100 px-2 py-0.5 rounded-full">
                {freeFlipsLeft} giro{freeFlipsLeft !== 1 ? "s" : ""} gratis
              </span>
            )}
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
                {feedback.isCorrect ? "Pareja encontrada!" : "Sigue intentando"}
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

        {/* Memory Grid */}
        <div className="grid grid-cols-3 gap-2">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card)}
              disabled={card.isFlipped || card.isMatched || isChecking}
              className="aspect-[3/4] perspective-1000"
              aria-label={card.isFlipped ? (card.type === "text" ? card.content : "Imagen") : "Tarjeta oculta"}
            >
              <div
                className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
                  card.isFlipped || card.isMatched ? "rotate-y-180" : ""
                }`}
              >
                {/* Card Back (face down) */}
                <div className="absolute inset-0 backface-hidden rounded-xl border-2 border-sky-300 bg-sky-100 shadow-md flex items-center justify-center">
                  <div className="text-sky-400">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <path d="M12 17h.01" />
                    </svg>
                  </div>
                </div>

                {/* Card Front (face up) */}
                <div
                  className={`absolute inset-0 backface-hidden rotate-y-180 rounded-xl border-2 shadow-md overflow-hidden flex items-center justify-center ${
                    card.isMatched
                      ? "border-green-400 bg-green-50 ring-2 ring-green-300"
                      : "border-sky-300 bg-white"
                  }`}
                >
                  {card.type === "image" ? (
                    <Image
                      src={card.content}
                      alt="Tarjeta"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 33vw, 200px"
                    />
                  ) : (
                    <p className="text-xs font-semibold text-foreground text-center px-1.5 leading-tight">
                      {card.content}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Exit button */}
        <Button onClick={() => router.push("/game")} variant="outline" className="w-full rounded-xl bg-white/90">
          Salir
        </Button>

      </div>
    </div>
  )
}

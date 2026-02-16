"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Star, ArrowLeft, Check, X, RotateCcw, Sparkles } from "lucide-react"

interface GardenCard {
  id: string
  text: string
  image: string
  isCorrect: boolean
  feedback: string
}

interface GardenGameProps {
  levelId: number
  userId: string
  title: string
  question: string
  cards: GardenCard[]
  gardenImages: string[]
  backgroundImage?: string
}

export function GardenGame({
  levelId,
  userId,
  title,
  question,
  cards,
  gardenImages,
  backgroundImage,
}: GardenGameProps) {
  const router = useRouter()
  const [shuffledCards, setShuffledCards] = useState<GardenCard[]>([])
  const [placedCards, setPlacedCards] = useState<string[]>([])
  const [correctCount, setCorrectCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)
  const [currentFeedback, setCurrentFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null)
  const [draggingCard, setDraggingCard] = useState<string | null>(null)
  const [gameComplete, setGameComplete] = useState(false)
  const [stars, setStars] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [wrongCard, setWrongCard] = useState<string | null>(null)
  const feedbackTimeout = useRef<NodeJS.Timeout | null>(null)

  // Touch drag state
  const [touchDragCard, setTouchDragCard] = useState<string | null>(null)
  const [touchPos, setTouchPos] = useState({ x: 0, y: 0 })
  const favorZoneRef = useRef<HTMLDivElement>(null)
  const noFavorZoneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    setShuffledCards(shuffled)
  }, [cards])

  const getGardenIndex = useCallback((correct: number) => {
    const total = cards.filter(c => c.isCorrect).length
    if (correct === 0) return 0
    if (correct <= Math.floor(total * 0.33)) return 1
    if (correct <= Math.floor(total * 0.66)) return 2
    return 3
  }, [cards])

  const handleDrop = useCallback((cardId: string, droppedOnCorrectZone: boolean) => {
    const card = shuffledCards.find(c => c.id === cardId)
    if (!card || placedCards.includes(cardId)) return

    const isRightZone = (card.isCorrect && droppedOnCorrectZone) || (!card.isCorrect && !droppedOnCorrectZone)

    if (isRightZone) {
      const newPlaced = [...placedCards, cardId]
      setPlacedCards(newPlaced)
      const newCorrect = card.isCorrect ? correctCount + 1 : correctCount
      if (card.isCorrect) setCorrectCount(newCorrect)

      setCurrentFeedback({ text: card.feedback, isCorrect: true })

      if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current)
      feedbackTimeout.current = setTimeout(() => {
        setCurrentFeedback(null)
        // Check if all cards placed
        if (newPlaced.length === shuffledCards.length) {
          finishGame(newCorrect)
        }
      }, 2500)
    } else {
      setErrorCount(prev => prev + 1)
      setWrongCard(cardId)
      setCurrentFeedback({ text: "Esa tarjeta va en la otra zona. Intenta de nuevo.", isCorrect: false })

      if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current)
      feedbackTimeout.current = setTimeout(() => {
        setCurrentFeedback(null)
        setWrongCard(null)
      }, 2000)
    }

    setDraggingCard(null)
    setTouchDragCard(null)
  }, [shuffledCards, placedCards, correctCount])

  const finishGame = async (finalCorrect: number) => {
    const totalCorrect = cards.filter(c => c.isCorrect).length
    let earnedStars = 0
    if (finalCorrect === totalCorrect && errorCount === 0) earnedStars = 3
    else if (finalCorrect >= totalCorrect - 1) earnedStars = 2
    else earnedStars = 1

    setStars(earnedStars)
    setGameComplete(true)

    setTimeout(() => setShowResults(true), 1000)

    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, levelId, stars: earnedStars }),
      })
    } catch (e) {
      console.error("Error saving progress:", e)
    }
  }

  // Drag and drop handlers (HTML5)
  const handleDragStart = (cardId: string) => {
    setDraggingCard(cardId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDropOnZone = (e: React.DragEvent, isCorrectZone: boolean) => {
    e.preventDefault()
    if (draggingCard) {
      handleDrop(draggingCard, isCorrectZone)
    }
  }

  // Touch handlers
  const handleTouchStart = (cardId: string, e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchDragCard(cardId)
    setTouchPos({ x: touch.clientX, y: touch.clientY })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDragCard) return
    e.preventDefault()
    const touch = e.touches[0]
    setTouchPos({ x: touch.clientX, y: touch.clientY })
  }

  const handleTouchEnd = () => {
    if (!touchDragCard) return

    const favorRect = favorZoneRef.current?.getBoundingClientRect()
    const noFavorRect = noFavorZoneRef.current?.getBoundingClientRect()

    if (favorRect && touchPos.x >= favorRect.left && touchPos.x <= favorRect.right && touchPos.y >= favorRect.top && touchPos.y <= favorRect.bottom) {
      handleDrop(touchDragCard, true)
    } else if (noFavorRect && touchPos.x >= noFavorRect.left && touchPos.x <= noFavorRect.right && touchPos.y >= noFavorRect.top && touchPos.y <= noFavorRect.bottom) {
      handleDrop(touchDragCard, false)
    }

    setTouchDragCard(null)
  }

  const gardenIndex = getGardenIndex(correctCount)
  const availableCards = shuffledCards.filter(c => !placedCards.includes(c.id))

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      {backgroundImage && (
        <div className="fixed inset-0 z-0">
          <Image src={backgroundImage} alt="" fill className="object-cover" priority sizes="100vw" />
          <div className="absolute inset-0 bg-black/10" />
        </div>
      )}

      <div className="relative z-10 flex flex-col min-h-screen p-4 pb-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/game")} className="bg-white/80 backdrop-blur-sm rounded-full shadow-md h-10 w-10">
            <ArrowLeft size={20} />
          </Button>
          <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-md">
            <h1 className="text-base font-bold text-foreground">{title}</h1>
            <p className="text-xs text-muted-foreground">{question}</p>
          </div>
        </div>

        {/* Garden Image */}
        <div className="relative mx-auto w-full max-w-xs aspect-square mb-4 rounded-2xl overflow-hidden shadow-lg border-2 border-white/50">
          {gardenImages.map((img, i) => (
            <div
              key={img}
              className="absolute inset-0 transition-opacity duration-1000"
              style={{ opacity: gardenIndex === i ? 1 : 0 }}
            >
              <Image src={img} alt={`Jardin estado ${i}`} fill className="object-cover" sizes="320px" />
            </div>
          ))}
          {gardenIndex === 3 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles size={48} className="text-yellow-300 animate-sparkle drop-shadow-lg" />
            </div>
          )}
          {/* Progress label */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold text-emerald-700 shadow">
            {correctCount} / {cards.filter(c => c.isCorrect).length} correctas
          </div>
        </div>

        {/* Drop Zones */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Favorece */}
          <div
            ref={favorZoneRef}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnZone(e, true)}
            className={`rounded-2xl border-2 border-dashed p-3 text-center transition-all min-h-[80px] flex flex-col items-center justify-center ${
              draggingCard || touchDragCard
                ? "border-emerald-400 bg-emerald-50/90 scale-[1.02] shadow-lg"
                : "border-emerald-300 bg-emerald-50/70"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center mb-1">
              <Check size={16} className="text-emerald-700" />
            </div>
            <span className="text-xs font-bold text-emerald-700">Favorece la lactancia</span>
          </div>

          {/* No favorece */}
          <div
            ref={noFavorZoneRef}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnZone(e, false)}
            className={`rounded-2xl border-2 border-dashed p-3 text-center transition-all min-h-[80px] flex flex-col items-center justify-center ${
              draggingCard || touchDragCard
                ? "border-rose-400 bg-rose-50/90 scale-[1.02] shadow-lg"
                : "border-rose-300 bg-rose-50/70"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-rose-200 flex items-center justify-center mb-1">
              <X size={16} className="text-rose-700" />
            </div>
            <span className="text-xs font-bold text-rose-700">No favorece</span>
          </div>
        </div>

        {/* Feedback */}
        {currentFeedback && (
          <div className={`mb-3 rounded-2xl p-3 shadow-md backdrop-blur-sm flex items-start gap-2 transition-all animate-in fade-in slide-in-from-bottom-2 ${
            currentFeedback.isCorrect ? "bg-emerald-50/95 border border-emerald-200" : "bg-rose-50/95 border border-rose-200"
          }`}>
            <Image
              src="/images/mascota-gota.png"
              alt="Mascota"
              width={40}
              height={40}
              className="object-contain flex-shrink-0"
            />
            <p className={`text-xs leading-relaxed ${currentFeedback.isCorrect ? "text-emerald-800" : "text-rose-800"}`}>
              {currentFeedback.text}
            </p>
          </div>
        )}

        {/* Cards */}
        {!gameComplete && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {availableCards.map((card) => (
              <div
                key={card.id}
                draggable
                onDragStart={() => handleDragStart(card.id)}
                onTouchStart={(e) => handleTouchStart(card.id, e)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`flex flex-col items-center bg-white/90 backdrop-blur-sm rounded-xl p-2 shadow-md cursor-grab active:cursor-grabbing transition-all hover:shadow-lg hover:scale-[1.02] ${
                  wrongCard === card.id ? "animate-shake border-2 border-rose-400" : "border border-white/50"
                } ${touchDragCard === card.id ? "opacity-50 scale-95" : ""}`}
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-1">
                  <Image src={card.image} alt={card.text} fill className="object-cover" sizes="(max-width: 640px) 45vw, 150px" />
                </div>
                <span className="text-[11px] font-semibold text-foreground text-center leading-tight">{card.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Touch drag ghost */}
        {touchDragCard && (
          <div
            className="fixed z-50 pointer-events-none bg-white/90 rounded-xl shadow-2xl p-2 flex items-center gap-2 max-w-[200px]"
            style={{ left: touchPos.x - 80, top: touchPos.y - 30 }}
          >
            {(() => {
              const c = shuffledCards.find(c => c.id === touchDragCard)
              if (!c) return null
              return (
                <>
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    <Image src={c.image} alt={c.text} fill className="object-cover" sizes="40px" />
                  </div>
                  <span className="text-xs font-medium truncate">{c.text}</span>
                </>
              )
            })()}
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
              <Image
                src="/images/mascota-gota.png"
                alt="Mascota"
                width={80}
                height={80}
                className="mx-auto mb-3 object-contain"
              />

              {/* Garden final state */}
              <div className="relative w-40 h-40 mx-auto mb-4 rounded-2xl overflow-hidden shadow-md">
                <Image
                  src={gardenImages[gardenIndex]}
                  alt="Tu jardin"
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              </div>

              <h2 className="text-xl font-bold text-foreground mb-2">
                {stars === 3 ? "Tu jardin florece con esplendor!" : stars === 2 ? "Tu jardin esta creciendo!" : "Tu jardin esta brotando!"}
              </h2>

              <p className="text-sm text-muted-foreground mb-3">
                {stars === 3
                  ? "Tu jardin florece cuando apoyas la lactancia!"
                  : "Sigue aprendiendo para hacer florecer tu jardin por completo."}
              </p>

              {/* Stars */}
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    size={32}
                    className={`transition-all duration-500 ${
                      s <= stars ? "fill-yellow-400 text-yellow-400 scale-110" : "text-gray-300"
                    }`}
                    style={{ transitionDelay: `${s * 200}ms` }}
                  />
                ))}
              </div>

              <div className="text-xs text-muted-foreground mb-4 space-y-1">
                <p>Correctas: {correctCount}/{cards.filter(c => c.isCorrect).length}</p>
                <p>Errores: {errorCount}</p>
              </div>

              <div className="space-y-2 pt-2">
                <Button onClick={() => router.push("/game")} className="w-full rounded-xl">
                  Volver a Niveles
                </Button>
                <Button onClick={() => router.push("/profile")} variant="outline" className="w-full rounded-xl bg-transparent">
                  Ver Mi Perfil
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

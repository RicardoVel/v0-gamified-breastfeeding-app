"use client"

import type React from "react"
import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Star, X, Check, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { MusicControl } from "@/components/music-control"

interface ClassifyItem {
  text: string
  image?: string
  category: "mito" | "verdad"
  feedback?: string
}

interface GameItem {
  id: string
  text: string
  image?: string
  category: "mito" | "verdad"
  feedback?: string
}

interface PlacedItem extends GameItem {
  placedIn: "mito" | "verdad"
  isCorrect: boolean
}

interface FeedbackState {
  message: string
  isCorrect: boolean
  visible: boolean
}

interface ClassifyGameProps {
  levelId: number
  userId: string
  title: string
  question: string
  items: ClassifyItem[]
  backgroundImage?: string
}

export function ClassifyGame({
  levelId,
  userId,
  title,
  question,
  items,
  backgroundImage,
}: ClassifyGameProps) {
  const router = useRouter()
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null)
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [stars, setStars] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>({ message: "", isCorrect: false, visible: false })
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Shuffle items only once
  const allItems: GameItem[] = useMemo(() => {
    return items.map((item, i) => ({
      id: `item-${i}`,
      text: item.text,
      image: item.image,
      category: item.category,
      feedback: item.feedback,
    })).sort(() => Math.random() - 0.5)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const availableItems = allItems.filter(
    (item) => !placedItems.some((placed) => placed.id === item.id)
  )

  const mitosPlaced = placedItems.filter((p) => p.placedIn === "mito")
  const verdadesPlaced = placedItems.filter((p) => p.placedIn === "verdad")

  // Show feedback with mascot
  const showFeedback = (message: string, isCorrect: boolean) => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current)
    }
    setFeedback({ message, isCorrect, visible: true })
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback((prev) => ({ ...prev, visible: false }))
    }, 11000)
  }

  // Place item in a zone
  const placeItem = (item: GameItem, zone: "mito" | "verdad") => {
    const isCorrect = item.category === zone
    const placed: PlacedItem = {
      ...item,
      placedIn: zone,
      isCorrect,
    }

    const newPlacedItems = [...placedItems, placed]
    setPlacedItems(newPlacedItems)
    setSelectedItem(null)

    const defaultCorrect = zone === "verdad"
      ? "¡Muy bien! Identificaste un beneficio real de la lactancia."
      : "¡Correcto! Detectaste un mito común sobre la lactancia."

    const defaultIncorrect = zone === "verdad"
      ? "Casi… esta afirmación es un mito, no un beneficio real."
      : "Ups… esta afirmación es verdadera, no un mito."

    showFeedback(item.feedback || (isCorrect ? defaultCorrect : defaultIncorrect), isCorrect)

    if (newPlacedItems.length === allItems.length) {
      setTimeout(() => {
        finishGame(newPlacedItems)
      }, 9000)
    }
  }

  // Drag
  const handleDragStart = (item: GameItem) => {
    setSelectedItem(item)
  }

  const handleDrop = (e: React.DragEvent, zone: "mito" | "verdad") => {
    e.preventDefault()
    if (selectedItem) {
      placeItem(selectedItem, zone)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Tap mobile
  const handleItemTap = (item: GameItem) => {
    setSelectedItem(selectedItem?.id === item.id ? null : item)
  }

  const handleZoneTap = (zone: "mito" | "verdad") => {
    if (selectedItem) {
      placeItem(selectedItem, zone)
    }
  }

  // Finish game
  const finishGame = async (finalPlacedItems: PlacedItem[]) => {
    const correctCount = finalPlacedItems.filter((p) => p.isCorrect).length
    const totalItems = finalPlacedItems.length

    let earnedStars = 0
    if (correctCount === totalItems) earnedStars = 3
    else if (correctCount >= totalItems * 0.75) earnedStars = 2
    else if (correctCount >= totalItems * 0.5) earnedStars = 1

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
        .eq("game_type", "classify")
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
        game_type: "classify",
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
        ? "Sigue asi! Clasificar mitos y verdades te ayuda a informar mejor sobre lactancia."
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
            Clasificaste {placedItems.filter((p) => p.isCorrect).length} de {placedItems.length} correctamente
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

          <Button onClick={() => router.push("/game")} className="w-full rounded-xl" disabled={isSaving}>
            Volver a Niveles
          </Button>
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
      <MusicControl track="oasis" volume={0.25} />
      <div className="max-w-lg mx-auto space-y-3 w-full">

        {/* Header */}
        <div className="bg-white/90 rounded-2xl p-3 shadow-lg">
          <h1 className="text-lg font-bold">{title}</h1>
          <p className="text-xs text-muted-foreground">{question}</p>
          <p className="text-xs mt-1">{placedItems.length} / {allItems.length} clasificados</p>
        </div>

        {/* Zones */}
        <div className="grid grid-cols-2 gap-3">

          {/* MITOS */}
          <div onDrop={(e) => handleDrop(e, "mito")} onDragOver={handleDragOver} onClick={() => handleZoneTap("mito")}
            className="bg-red-100 border-2 border-red-300 rounded-2xl p-3 min-h-[180px]">

            <h3 className="bg-red-500 text-white text-center py-1.5 rounded-xl text-sm font-bold mb-2">
              MITOS
            </h3>

            <div className="flex flex-wrap gap-1.5 justify-center">
              {mitosPlaced.map((item) => (
                <div key={item.id}
                  className={`rounded-lg border-2 p-1 ${
                    item.category === "mito" ? "border-green-400" : "border-red-400"
                  }`}>
                  {item.image && (
                    <Image src={item.image || "/placeholder.svg"} alt={item.text} width={55} height={55} className="object-contain" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* VERDADES */}
          <div onDrop={(e) => handleDrop(e, "verdad")} onDragOver={handleDragOver} onClick={() => handleZoneTap("verdad")}
            className="bg-green-100 border-2 border-green-300 rounded-2xl p-3 min-h-[180px]">

            <h3 className="bg-green-500 text-white text-center py-1.5 rounded-xl text-sm font-bold mb-2">
              VERDADES
            </h3>

            <div className="flex flex-wrap gap-1.5 justify-center">
              {verdadesPlaced.map((item) => (
                <div key={item.id}
                  className={`rounded-lg border-2 p-1 ${
                    item.category === "verdad" ? "border-green-400" : "border-red-400"
                  }`}>
                  {item.image && (
                    <Image src={item.image || "/placeholder.svg"} alt={item.text} width={55} height={55} className="object-contain" />
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Feedback Mascot */}
        {feedback.visible && (
          <div className={`flex items-end gap-3 p-3 rounded-2xl shadow-lg animate-in slide-in-from-top-4 duration-300 ${
            feedback.isCorrect ? "bg-green-50 border-2 border-green-300" : "bg-red-50 border-2 border-red-300"
          }`}>
            <Image src="/images/mascota-triste.png" alt="Mascota" width={55} height={55} className="object-contain flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold mb-0.5 ${feedback.isCorrect ? "text-green-700" : "text-red-700"}`}>
                {feedback.isCorrect ? "¡Bien hecho!" : "Sigue intentando"}
              </p>
              <p className={`text-xs leading-relaxed ${feedback.isCorrect ? "text-green-600" : "text-red-600"}`}>{feedback.message}</p>
            </div>
            <button onClick={() => setFeedback((p) => ({ ...p, visible: false }))} className="flex-shrink-0 p-1 rounded-full hover:bg-black/10">
              <X size={14} className="text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Available Cards */}
        {availableItems.length > 0 && (
          <Card className="rounded-2xl p-3 shadow-lg bg-white/95">
            <h3 className="text-sm font-semibold mb-2 text-center">
              {selectedItem ? "Elige MITO o VERDAD" : "Toca una carta"}
            </h3>

            <div className="flex flex-wrap gap-2 justify-center">
              {availableItems.map((item) => (
                <div key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item)}
                  onClick={() => handleItemTap(item)}
                  className={`cursor-pointer border-2 rounded-2xl shadow-md p-2 transition-all text-center ${
                    selectedItem?.id === item.id
                      ? "border-sky-500 ring-2 ring-sky-400 scale-110 bg-sky-50"
                      : "border-sky-200 hover:scale-105"
                  }`}>

                  <div className="flex flex-col items-center gap-1">
                    {item.image && (
                      <Image src={item.image || "/placeholder.svg"} alt={item.text} width={70} height={70} className="object-contain" />
                    )}
                    <span className="text-xs font-medium leading-tight">{item.text}</span>
                  </div>

                </div>
              ))}
            </div>
          </Card>
        )}

        <Button onClick={() => router.push("/game")} variant="outline" className="w-full rounded-xl">
          Salir
        </Button>

      </div>
    </div>
  )
}

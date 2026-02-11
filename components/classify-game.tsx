"use client"

import type React from "react"
import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Star, X, Check, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"

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
    }, 4000)
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
      ? "Correcto! Esto es una verdad sobre la lactancia."
      : "Correcto! Esto es un mito sobre la lactancia."
    const defaultIncorrect = zone === "verdad"
      ? "No es correcto. Esto no es una verdad, es un mito."
      : "No es correcto. Esto no es un mito, es una verdad."

    showFeedback(item.feedback || (isCorrect ? defaultCorrect : defaultIncorrect), isCorrect)

    // Check if all items have been placed
    if (newPlacedItems.length === allItems.length) {
      setTimeout(() => {
        finishGame(newPlacedItems)
      }, 2000)
    }
  }

  // Handle desktop drag
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

  // Handle mobile tap
  const handleItemTap = (item: GameItem) => {
    if (selectedItem?.id === item.id) {
      setSelectedItem(null)
    } else {
      setSelectedItem(item)
    }
  }

  const handleZoneTap = (zone: "mito" | "verdad") => {
    if (selectedItem) {
      placeItem(selectedItem, zone)
    }
  }

  // Finish game and save
  const finishGame = async (finalPlacedItems: PlacedItem[]) => {
    const correctCount = finalPlacedItems.filter((p) => p.isCorrect).length
    const totalItems = finalPlacedItems.length

    let earnedStars = 0
    if (correctCount === totalItems) {
      earnedStars = 3
    } else if (correctCount >= totalItems * 0.75) {
      earnedStars = 2
    } else if (correctCount >= totalItems * 0.5) {
      earnedStars = 1
    }

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
          const newTotalStars = userData.total_stars + starsToAdd
          const newXP = userData.experience_points + starsToAdd * 10
          const newLevel = Math.floor(newXP / 30) + 1

          await supabase
            .from("users")
            .update({
              total_stars: newTotalStars,
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

  // Cleanup
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const preventScroll = (e: TouchEvent) => {
      if (selectedItem) {
        e.preventDefault()
      }
    }
    document.addEventListener("touchmove", preventScroll, { passive: false })
    return () => document.removeEventListener("touchmove", preventScroll)
  }, [selectedItem])

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
            Clasificaste {placedItems.filter((p) => p.isCorrect).length} de {placedItems.length} correctamente
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
      className="min-h-screen p-3 md:p-6 relative"
      style={backgroundImage ? {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      } : undefined}
    >
      <div className="max-w-lg mx-auto space-y-3">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
          <p className="text-xs text-muted-foreground">{question}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {placedItems.length} / {allItems.length} clasificados
          </p>
        </div>

        {/* Two Drop Zones */}
        <div className="grid grid-cols-2 gap-3">
          {/* MITOS Zone */}
          <div
            className={`rounded-2xl overflow-hidden transition-all ${
              selectedItem ? "ring-2 ring-red-400 ring-opacity-75" : ""
            }`}
            onDrop={(e) => handleDrop(e, "mito")}
            onDragOver={handleDragOver}
            onClick={() => handleZoneTap("mito")}
            onKeyDown={(e) => e.key === "Enter" && handleZoneTap("mito")}
            role="button"
            tabIndex={0}
          >
            <div className="bg-red-100/90 backdrop-blur-sm border-2 border-red-300 rounded-2xl p-3 min-h-[180px]">
              <div className="bg-red-400 text-white text-center py-1.5 rounded-xl mb-2">
                <h3 className="text-sm font-bold">MITOS</h3>
              </div>
              {selectedItem && (
                <p className="text-red-500 text-center text-xs animate-pulse mb-2">
                  Toca para soltar aqui
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 justify-center">
                {mitosPlaced.map((item) => (
                  <div
                    key={item.id}
                    className={`relative rounded-lg overflow-hidden border-2 ${
                      item.isCorrect ? "border-green-400" : "border-red-400"
                    }`}
                  >
                    {item.image ? (
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.text}
                        width={55}
                        height={55}
                        className="object-contain"
                      />
                    ) : (
                      <span className="text-xs p-1 block">{item.text}</span>
                    )}
                    <div className={`absolute -top-0.5 -right-0.5 rounded-full p-0.5 ${
                      item.isCorrect ? "bg-green-500" : "bg-red-500"
                    }`}>
                      {item.isCorrect
                        ? <Check size={8} className="text-white" />
                        : <X size={8} className="text-white" />
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* VERDADES Zone */}
          <div
            className={`rounded-2xl overflow-hidden transition-all ${
              selectedItem ? "ring-2 ring-green-400 ring-opacity-75" : ""
            }`}
            onDrop={(e) => handleDrop(e, "verdad")}
            onDragOver={handleDragOver}
            onClick={() => handleZoneTap("verdad")}
            onKeyDown={(e) => e.key === "Enter" && handleZoneTap("verdad")}
            role="button"
            tabIndex={0}
          >
            <div className="bg-green-100/90 backdrop-blur-sm border-2 border-green-300 rounded-2xl p-3 min-h-[180px]">
              <div className="bg-green-500 text-white text-center py-1.5 rounded-xl mb-2">
                <h3 className="text-sm font-bold">VERDADES</h3>
              </div>
              {selectedItem && (
                <p className="text-green-600 text-center text-xs animate-pulse mb-2">
                  Toca para soltar aqui
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 justify-center">
                {verdadesPlaced.map((item) => (
                  <div
                    key={item.id}
                    className={`relative rounded-lg overflow-hidden border-2 ${
                      item.isCorrect ? "border-green-400" : "border-red-400"
                    }`}
                  >
                    {item.image ? (
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.text}
                        width={55}
                        height={55}
                        className="object-contain"
                      />
                    ) : (
                      <span className="text-xs p-1 block">{item.text}</span>
                    )}
                    <div className={`absolute -top-0.5 -right-0.5 rounded-full p-0.5 ${
                      item.isCorrect ? "bg-green-500" : "bg-red-500"
                    }`}>
                      {item.isCorrect
                        ? <Check size={8} className="text-white" />
                        : <X size={8} className="text-white" />
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Available Items */}
        {availableItems.length > 0 && (
          <Card className="rounded-2xl p-3 shadow-lg bg-white/95 backdrop-blur-sm">
            <h3 className="text-sm font-semibold mb-2 text-foreground">
              {selectedItem ? "Toca MITOS o VERDADES para clasificar" : "Toca una carta para seleccionarla"}
            </h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {availableItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item)}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleItemTap(item)
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleItemTap(item)}
                  role="button"
                  tabIndex={0}
                  className={`cursor-pointer bg-white border-2 rounded-2xl shadow-md transition-all select-none ${
                    item.image ? "p-1.5" : "px-3 py-2"
                  } ${
                    selectedItem?.id === item.id
                      ? "border-sky-500 ring-2 ring-sky-400 scale-110 shadow-xl bg-sky-50"
                      : "border-sky-200 hover:shadow-lg hover:scale-105 active:scale-95"
                  }`}
                >
                  {item.image ? (
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.text}
                      width={70}
                      height={70}
                      className="object-contain pointer-events-none rounded-lg"
                      draggable={false}
                    />
                  ) : (
                    <span className="font-medium text-foreground text-xs">{item.text}</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Mascot Feedback */}
        {feedback.visible && (
          <div
            className={`flex items-end gap-3 p-3 rounded-2xl shadow-lg transition-all animate-in slide-in-from-bottom-4 duration-300 ${
              feedback.isCorrect
                ? "bg-green-50 border-2 border-green-300"
                : "bg-red-50 border-2 border-red-300"
            }`}
          >
            <Image
              src="/images/mascota-gota.png"
              alt="Mascota Gota de Leche"
              width={55}
              height={55}
              className="object-contain flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold mb-0.5 ${
                feedback.isCorrect ? "text-green-700" : "text-red-700"
              }`}>
                {feedback.isCorrect ? "Correcto!" : "Incorrecto"}
              </p>
              <p className={`text-xs leading-relaxed ${
                feedback.isCorrect ? "text-green-600" : "text-red-600"
              }`}>
                {feedback.message}
              </p>
            </div>
            <button
              onClick={() => setFeedback((prev) => ({ ...prev, visible: false }))}
              className="flex-shrink-0 p-1 rounded-full hover:bg-black/10"
            >
              <X size={14} className="text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Exit button */}
        <Button
          onClick={() => router.push("/game")}
          variant="outline"
          className="w-full rounded-xl bg-white/90"
        >
          Salir
        </Button>
      </div>
    </div>
  )
}

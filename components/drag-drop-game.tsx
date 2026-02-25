"use client"

import type React from "react"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Star, X, Check, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"

interface AnswerOption {
  text: string
  image?: string
  feedback?: string
}

interface DragItem {
  id: string
  text: string
  image?: string
  isCorrect: boolean
  feedback?: string
}

interface DroppedItem extends DragItem {
  droppedAt: number
}

interface FeedbackState {
  message: string
  isCorrect: boolean
  visible: boolean
}

interface DragDropGameProps {
  levelId: number
  userId: string
  title: string
  question: string
  correctAnswers: (string | AnswerOption)[]
  incorrectAnswers: (string | AnswerOption)[]
  backgroundImage?: string
  dropZoneImage?: string
}

export function DragDropGame({
  levelId,
  userId,
  title,
  question,
  correctAnswers,
  incorrectAnswers,
  backgroundImage,
  dropZoneImage,
}: DragDropGameProps) {
  const router = useRouter()
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null)
  const [selectedItem, setSelectedItem] = useState<DragItem | null>(null)
  const [droppedItems, setDroppedItems] = useState<DroppedItem[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [stars, setStars] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>({ message: "", isCorrect: false, visible: false })
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Helper to normalize answer options
  const normalizeOption = (option: string | AnswerOption): { text: string; image?: string; feedback?: string } => {
    if (typeof option === "string") {
      return { text: option }
    }
    return option
  }

  // Show feedback with mascot
  const showFeedback = (item: DragItem) => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current)
    }
    const defaultCorrect = "!Muy bien! Esa es una respuesta correcta."
    const defaultIncorrect = "Eso no es correcto. Intenta con otra opcion."
    setFeedback({
      message: item.feedback || (item.isCorrect ? defaultCorrect : defaultIncorrect),
      isCorrect: item.isCorrect,
      visible: true,
    })
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback((prev) => ({ ...prev, visible: false }))
    }, 7000)
  }

  // Shuffle items only once using useMemo with empty dependency
  const allItems: DragItem[] = useMemo(() => {
    return [
      ...correctAnswers.map((option, i) => {
        const normalized = normalizeOption(option)
      return {
        id: `correct-${i}`,
        text: normalized.text,
        image: normalized.image,
        isCorrect: true,
        feedback: normalized.feedback,
      }
    }),
    ...incorrectAnswers.map((option, i) => {
      const normalized = normalizeOption(option)
      return {
        id: `incorrect-${i}`,
        text: normalized.text,
        image: normalized.image,
        isCorrect: false,
        feedback: normalized.feedback,
      }
      }),
    ].sort(() => Math.random() - 0.5)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const availableItems = allItems.filter((item) => !droppedItems.some((dropped) => dropped.id === item.id))

  // Desktop drag handlers
  const handleDragStart = (item: DragItem) => {
    setDraggedItem(item)
    setSelectedItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedItem) {
      setDroppedItems([...droppedItems, { ...draggedItem, droppedAt: Date.now() }])
      showFeedback(draggedItem)
      setDraggedItem(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Mobile tap-to-select handlers
  const handleItemTap = (item: DragItem) => {
    if (selectedItem?.id === item.id) {
      // Deselect if tapping same item
      setSelectedItem(null)
    } else {
      // Select new item
      setSelectedItem(item)
    }
  }

  const handleDropZoneTap = () => {
    if (selectedItem) {
      // Drop the selected item and show feedback
      setDroppedItems([...droppedItems, { ...selectedItem, droppedAt: Date.now() }])
      showFeedback(selectedItem)
      setSelectedItem(null)
    }
  }

  const handleRemoveItem = (id: string) => {
    setDroppedItems(droppedItems.filter((item) => item.id !== id))
  }

  // Cleanup feedback timeout on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current)
      }
    }
  }, [])

  // Prevent body scroll when touching game area
  useEffect(() => {
    const preventScroll = (e: TouchEvent) => {
      if (selectedItem) {
        e.preventDefault()
      }
    }
    document.addEventListener('touchmove', preventScroll, { passive: false })
    return () => document.removeEventListener('touchmove', preventScroll)
  }, [selectedItem])

  const handleSubmit = async () => {
    const correctCount = droppedItems.filter((item) => item.isCorrect).length
    const incorrectCount = droppedItems.filter((item) => !item.isCorrect).length
    const totalCorrect = correctAnswers.length

    // Calculate stars (0-3)
    let earnedStars = 0
    if (correctCount === totalCorrect && incorrectCount === 0) {
      earnedStars = 3 // Perfect
    } else if (correctCount >= totalCorrect * 0.75 && incorrectCount <= 1) {
      earnedStars = 2 // Good
    } else if (correctCount >= totalCorrect * 0.5) {
      earnedStars = 1 // Needs improvement
    }

    setStars(earnedStars)
    setIsCompleted(true)

    // Save progress to database
    setIsSaving(true)
    const supabase = createClient()

    try {
      // Get the best previous result for this level
      const { data: previousBest } = await supabase
        .from("game_progress")
        .select("stars_earned")
        .eq("user_id", userId)
        .eq("level", levelId)
        .eq("game_type", "drag-drop")
        .order("stars_earned", { ascending: false })
        .limit(1)
        .single()

      const previousStars = previousBest?.stars_earned || 0
      
      // Only add the difference if we improved
      const starsToAdd = earnedStars > previousStars ? earnedStars - previousStars : 0
      const xpToAdd = starsToAdd * 10

      // Update user stats only if we improved
      if (starsToAdd > 0) {
        const { data: userData } = await supabase
          .from("users")
          .select("total_stars, experience_points, level")
          .eq("id", userId)
          .single()

        if (userData) {
          const newTotalStars = userData.total_stars + starsToAdd
          const newXP = userData.experience_points + xpToAdd
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

      // Save game progress (always save the attempt)
      await supabase.from("game_progress").insert({
        user_id: userId,
        game_type: "drag-drop",
        level: levelId,
        stars_earned: earnedStars,
        completed: true,
        completed_at: new Date().toISOString(),
      })

      // Award achievement if perfect score (only if not already achieved)
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

  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-lg w-full rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="space-y-4">
            <Sparkles className="text-soft-gold mx-auto animate-sparkle" size={64} />
            <h2 className="text-3xl font-bold">¡Nivel Completado!</h2>
            <p className="text-muted-foreground">
              Has ganado {stars} {stars === 1 ? "estrella" : "estrellas"}
            </p>
          </div>

          <div className="flex justify-center gap-2">
            {[1, 2, 3].map((i) => (
              <Star key={i} size={48} className={`${i <= stars ? "text-soft-gold fill-soft-gold" : "text-muted"}`} />
            ))}
          </div>

          <div className="space-y-3 pt-4">
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
      className="min-h-screen p-2 sm:p-3 md:p-6 relative overflow-x-hidden"
      style={backgroundImage ? {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      } : undefined}
    >
      <div className="max-w-lg mx-auto space-y-4 w-full">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
          <h1 className="text-xl font-bold mb-1 text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{question}</p>
        </div>

        {/* Drop Zone with Mama Image */}
        <div
          ref={dropZoneRef}
          className={`relative rounded-2xl overflow-hidden transition-all ${
            selectedItem ? "ring-4 ring-sky-400 ring-opacity-75 animate-pulse" : ""
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={handleDropZoneTap}
          onKeyDown={(e) => e.key === 'Enter' && handleDropZoneTap()}
          role="button"
          tabIndex={0}
        >
          {dropZoneImage ? (
            <div className="relative flex flex-col items-center">
              <Image
                src={dropZoneImage || "/placeholder.svg"}
                alt="Zona de arrastre"
                width={200}
                height={240}
                className="object-contain mx-auto drop-shadow-lg"
                priority
              />
              {/* Instructions when item selected */}
              {selectedItem && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-sky-500/90 text-white px-4 py-2 rounded-xl text-sm font-medium animate-bounce shadow-lg">
                  Toca aquí para soltar
                </div>
              )}
              {/* Dropped items around the image */}
              <div className="flex flex-wrap gap-2 justify-center mt-3 px-2">
                {droppedItems.length === 0 && !selectedItem ? (
                  <p className="text-white/90 text-center text-sm py-2 px-4 bg-black/20 rounded-xl backdrop-blur-sm">
                    Toca una opción y luego toca a la mamá
                  </p>
                ) : droppedItems.length === 0 && selectedItem ? null : (
                  droppedItems.map((item) => (
                    <div
                      key={item.id}
                      className={`relative flex flex-col items-center p-1 rounded-xl shadow-md ${
                        item.isCorrect
                          ? "bg-green-100/95 border-2 border-green-400"
                          : "bg-red-100/95 border-2 border-red-400"
                      }`}
                    >
                      {item.image ? (
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.text}
                          width={50}
                          height={50}
                          className="object-contain"
                        />
                      ) : (
                        <span className="font-medium text-xs px-2">{item.text}</span>
                      )}
                      <div className={`absolute -top-1 -right-1 rounded-full p-0.5 ${
                        item.isCorrect ? "bg-green-500" : "bg-red-500"
                      }`}>
                        {item.isCorrect ? <Check size={10} className="text-white" /> : <X size={10} className="text-white" />}
                      </div>
                      <button 
                        onClick={() => handleRemoveItem(item.id)} 
                        className="absolute -bottom-1 -right-1 bg-gray-600 rounded-full p-0.5 hover:bg-gray-800"
                      >
                        <X size={10} className="text-white" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <Card className="rounded-2xl p-6 min-h-48 border-4 border-dashed border-primary/30 bg-primary/5">
              <h3 className="text-lg font-semibold mb-3 text-center">Arrastra aquí las respuestas correctas</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {droppedItems.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6 text-sm">Arrastra las opciones aquí</p>
                ) : (
                  droppedItems.map((item) => (
                    <div
                      key={item.id}
                      className={`relative flex flex-col items-center p-1 rounded-xl shadow-md ${
                        item.isCorrect
                          ? "bg-green-100 border-2 border-green-400"
                          : "bg-red-100 border-2 border-red-400"
                      }`}
                    >
                      {item.image ? (
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.text}
                          width={50}
                          height={50}
                          className="object-contain"
                        />
                      ) : (
                        <span className="font-medium text-sm px-2">{item.text}</span>
                      )}
                      <div className={`absolute -top-1 -right-1 rounded-full p-0.5 ${
                        item.isCorrect ? "bg-green-500" : "bg-red-500"
                      }`}>
                        {item.isCorrect ? <Check size={10} className="text-white" /> : <X size={10} className="text-white" />}
                      </div>
                      <button 
                        onClick={() => handleRemoveItem(item.id)} 
                        className="absolute -bottom-1 -right-1 bg-gray-600 rounded-full p-0.5 hover:bg-gray-800"
                      >
                        <X size={10} className="text-white" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Mascot Feedback Bubble */}
        {feedback.visible && (
          <div 
            className={`flex items-end gap-3 p-3 rounded-2xl shadow-lg transition-all animate-in slide-in-from-top-4 duration-300 ${
              feedback.isCorrect 
                ? "bg-green-50 border-2 border-green-300" 
                : "bg-red-50 border-2 border-red-300"
            }`}
          >
            <Image
              src="/images/mascota-gota.png"
              alt="Mascota Gota de Leche"
              width={60}
              height={60}
              className="object-contain flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold mb-0.5 ${
                feedback.isCorrect ? "text-green-700" : "text-red-700"
              }`}>
                {feedback.isCorrect ? "Muy bien!" : "No es correcto"}
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

        {/* Available Items */}
        <Card className="rounded-2xl p-4 shadow-lg bg-white/95 backdrop-blur-sm">
          <h3 className="text-base font-semibold mb-3 text-foreground">
            {selectedItem ? "Ahora toca la zona de arriba para soltar" : "Toca una opcion para seleccionarla"}
          </h3>
          <div className="flex flex-wrap gap-3 justify-center">
            {availableItems.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item)}
                onDragEnd={handleDragEnd}
                onClick={(e) => {
                  e.stopPropagation()
                  handleItemTap(item)
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleItemTap(item)}
                role="button"
                tabIndex={0}
                className={`cursor-pointer bg-white border-2 rounded-2xl shadow-md transition-all select-none ${
                  item.image ? "p-2" : "px-3 py-2"
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
                    className="object-contain pointer-events-none"
                    draggable={false}
                  />
                ) : (
                  <span className="font-medium text-foreground text-sm">{item.text}</span>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={droppedItems.length === 0}
            className="flex-1 rounded-xl py-5 text-base"
          >
            Verificar Respuestas
          </Button>
          <Button onClick={() => router.push("/game")} variant="outline" className="rounded-xl px-4 bg-white/90">
            Salir
          </Button>
        </div>
      </div>
    </div>
  )
}

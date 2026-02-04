"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Star, X, Check, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"

interface DragItem {
  id: string
  text: string
  isCorrect: boolean
}

interface DroppedItem extends DragItem {
  droppedAt: number
}

interface DragDropGameProps {
  levelId: number
  userId: string
  title: string
  question: string
  correctAnswers: string[]
  incorrectAnswers: string[]
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
  const [droppedItems, setDroppedItems] = useState<DroppedItem[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [stars, setStars] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  // Shuffle items
  const allItems: DragItem[] = [
    ...correctAnswers.map((text, i) => ({
      id: `correct-${i}`,
      text,
      isCorrect: true,
    })),
    ...incorrectAnswers.map((text, i) => ({
      id: `incorrect-${i}`,
      text,
      isCorrect: false,
    })),
  ].sort(() => Math.random() - 0.5)

  const availableItems = allItems.filter((item) => !droppedItems.some((dropped) => dropped.id === item.id))

  const handleDragStart = (item: DragItem) => {
    setDraggedItem(item)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedItem) {
      setDroppedItems([...droppedItems, { ...draggedItem, droppedAt: Date.now() }])
      setDraggedItem(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleRemoveItem = (id: string) => {
    setDroppedItems(droppedItems.filter((item) => item.id !== id))
  }

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
      // Update user stats
      const { data: userData } = await supabase
        .from("users")
        .select("total_stars, experience_points, level")
        .eq("id", userId)
        .single()

      if (userData) {
        const newTotalStars = userData.total_stars + earnedStars
        const newXP = userData.experience_points + earnedStars * 10
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

      // Save game progress
      await supabase.from("game_progress").insert({
        user_id: userId,
        game_type: "drag-drop",
        level: levelId,
        stars_earned: earnedStars,
        completed: true,
        completed_at: new Date().toISOString(),
      })

      // Award achievement if perfect score
      if (earnedStars === 3) {
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
      className="min-h-screen p-3 md:p-6 relative"
      style={backgroundImage ? {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      } : undefined}
    >
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
          <h1 className="text-xl font-bold mb-1 text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{question}</p>
        </div>

        {/* Drop Zone with Mama Image */}
        <div
          className="relative rounded-2xl overflow-hidden"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
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
              {/* Dropped items around the image */}
              <div className="flex flex-wrap gap-2 justify-center mt-3 px-2">
                {droppedItems.length === 0 ? (
                  <p className="text-white/90 text-center text-sm py-2 px-4 bg-black/20 rounded-xl backdrop-blur-sm">
                    Arrastra las opciones hacia la mama
                  </p>
                ) : (
                  droppedItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-1 px-3 py-2 rounded-xl shadow-md text-sm ${
                        item.isCorrect
                          ? "bg-green-100/95 text-green-800 border border-green-300"
                          : "bg-red-100/95 text-red-800 border border-red-300"
                      }`}
                    >
                      {item.isCorrect ? <Check size={14} /> : <X size={14} />}
                      <span className="font-medium text-xs">{item.text}</span>
                      <button onClick={() => handleRemoveItem(item.id)} className="ml-1 hover:opacity-70">
                        <X size={12} />
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
                      className={`flex items-center gap-1 px-3 py-2 rounded-xl shadow-md text-sm ${
                        item.isCorrect
                          ? "bg-green-100 text-green-800 border border-green-300"
                          : "bg-red-100 text-red-800 border border-red-300"
                      }`}
                    >
                      {item.isCorrect ? <Check size={14} /> : <X size={14} />}
                      <span className="font-medium">{item.text}</span>
                      <button onClick={() => handleRemoveItem(item.id)} className="ml-1 hover:opacity-70">
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Available Items */}
        <Card className="rounded-2xl p-4 shadow-lg bg-white/95 backdrop-blur-sm">
          <h3 className="text-base font-semibold mb-3 text-foreground">Opciones disponibles</h3>
          <div className="flex flex-wrap gap-2">
            {availableItems.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item)}
                onDragEnd={handleDragEnd}
                className="cursor-move px-3 py-2 bg-white border-2 border-sky-200 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all active:cursor-grabbing text-sm"
              >
                <span className="font-medium text-foreground">{item.text}</span>
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

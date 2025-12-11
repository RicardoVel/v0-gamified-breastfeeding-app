"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Star, X, Check, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

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
}

export function DragDropGame({
  levelId,
  userId,
  title,
  question,
  correctAnswers,
  incorrectAnswers,
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
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <p className="text-lg text-muted-foreground">{question}</p>
        </div>

        {/* Drop Zone */}
        <Card
          className="rounded-3xl p-8 min-h-64 border-4 border-dashed border-primary/30 bg-primary/5"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <h3 className="text-xl font-semibold mb-4 text-center">Arrastra aquí las respuestas correctas</h3>
          <div className="flex flex-wrap gap-3 justify-center">
            {droppedItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Arrastra las opciones aquí</p>
            ) : (
              droppedItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-md ${
                    item.isCorrect
                      ? "bg-green-100 text-green-800 border-2 border-green-300"
                      : "bg-red-100 text-red-800 border-2 border-red-300"
                  }`}
                >
                  {item.isCorrect ? <Check size={20} /> : <X size={20} />}
                  <span className="font-medium">{item.text}</span>
                  <button onClick={() => handleRemoveItem(item.id)} className="ml-2 hover:opacity-70">
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Available Items */}
        <Card className="rounded-3xl p-6 shadow-xl">
          <h3 className="text-xl font-semibold mb-4">Opciones disponibles</h3>
          <div className="flex flex-wrap gap-3">
            {availableItems.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item)}
                onDragEnd={handleDragEnd}
                className="cursor-move px-4 py-3 bg-white border-2 border-border rounded-2xl shadow-md hover:shadow-lg hover:scale-105 transition-all active:cursor-grabbing"
              >
                <span className="font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={droppedItems.length === 0}
            className="flex-1 rounded-xl py-6 text-lg"
          >
            Verificar Respuestas
          </Button>
          <Button onClick={() => router.push("/game")} variant="outline" className="rounded-xl px-6">
            Salir
          </Button>
        </div>
      </div>
    </div>
  )
}

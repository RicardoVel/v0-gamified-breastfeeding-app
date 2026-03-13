"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Star, X, Sparkles, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { MusicControl } from "@/components/music-control"

interface WordEntry {
  word: string
  displayName: string
  feedback: string
}

interface WordSearchGameProps {
  levelId: number
  userId: string
  title: string
  question: string
  words: WordEntry[]
  gridBackgroundImage?: string
  backgroundImage?: string
  mascotImage?: string
}

interface PlacedWord {
  word: string
  cells: [number, number][]
}

interface FeedbackState {
  message: string
  isCorrect: boolean
  visible: boolean
}

const GRID_SIZE = 12
const DIRECTIONS: [number, number][] = [
  [0, 1],   // horizontal right
  [1, 0],   // vertical down
  [0, -1],  // horizontal left
  [-1, 0],  // vertical up
]

function generateGrid(words: WordEntry[]): { grid: string[][]; placedWords: PlacedWord[] } {
  const grid: string[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => "")
  )
  const placedWords: PlacedWord[] = []

  // Sort words by length (longest first for better placement)
  const sortedWords = [...words].sort((a, b) => b.word.length - a.word.length)

  for (const entry of sortedWords) {
    const word = entry.word.toUpperCase()
    let placed = false
    let attempts = 0

    while (!placed && attempts < 200) {
      attempts++
      const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
      const row = Math.floor(Math.random() * GRID_SIZE)
      const col = Math.floor(Math.random() * GRID_SIZE)

      // Check if word fits
      const cells: [number, number][] = []
      let fits = true

      for (let i = 0; i < word.length; i++) {
        const r = row + dir[0] * i
        const c = col + dir[1] * i

        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) {
          fits = false
          break
        }

        if (grid[r][c] !== "" && grid[r][c] !== word[i]) {
          fits = false
          break
        }

        cells.push([r, c])
      }

      if (fits) {
        for (let i = 0; i < word.length; i++) {
          grid[cells[i][0]][cells[i][1]] = word[i]
        }
        placedWords.push({ word, cells })
        placed = true
      }
    }
  }

  // Fill empty cells with random letters
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === "") {
        grid[r][c] = letters[Math.floor(Math.random() * letters.length)]
      }
    }
  }

  return { grid, placedWords }
}

function cellKey(r: number, c: number) {
  return `${r}-${c}`
}

export function WordSearchGame({
  levelId,
  userId,
  title,
  question,
  words,
  gridBackgroundImage,
  backgroundImage,
  mascotImage = "/images/mascota-gota.png",
}: WordSearchGameProps) {
  const router = useRouter()
  const [isCompleted, setIsCompleted] = useState(false)
  const [stars, setStars] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>({ message: "", isCorrect: false, visible: false })
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // Generate grid once
  const [{ grid, placedWords }] = useState(() => generateGrid(words))

  // Selection state
  const [selecting, setSelecting] = useState(false)
  const [selectedCells, setSelectedCells] = useState<[number, number][]>([])
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set())
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set())
  const [wrongCells, setWrongCells] = useState<Set<string>>(new Set())

  // Assign colors to found words
  const wordColors = ["bg-pink-300/60", "bg-emerald-300/60", "bg-sky-300/60", "bg-amber-300/60", "bg-violet-300/60"]
  const [foundWordColors, setFoundWordColors] = useState<Record<string, string>>({})
  const [foundWordCells, setFoundWordCells] = useState<Record<string, string>>({})

  const showFeedback = useCallback((message: string, isCorrect: boolean) => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
    setFeedback({ message, isCorrect, visible: true })
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback((prev) => ({ ...prev, visible: false }))
    }, 8000)
  }, [])

  // Check if selected cells match a word
  const checkSelection = useCallback((cells: [number, number][]) => {
    if (cells.length < 2) return

    const selectedWord = cells.map(([r, c]) => grid[r][c]).join("")
    const reversedWord = [...selectedWord].reverse().join("")

    for (const pw of placedWords) {
      if (foundWords.has(pw.word)) continue

      // Check if selected cells match this placed word (exact match)
      if (pw.word === selectedWord || pw.word === reversedWord) {
        // Check if cells actually overlay the placed word cells
        const pwCellKeys = new Set(pw.cells.map(([r, c]) => cellKey(r, c)))
        const selCellKeys = new Set(cells.map(([r, c]) => cellKey(r, c)))

        if (pwCellKeys.size === selCellKeys.size && [...pwCellKeys].every((k) => selCellKeys.has(k))) {
          // Found a word!
          const newFound = new Set(foundWords)
          newFound.add(pw.word)
          setFoundWords(newFound)

          // Mark cells as found with color
          const colorIndex = newFound.size - 1
          const color = wordColors[colorIndex % wordColors.length]
          const newFoundCells = new Set(foundCells)
          const newCellColors = { ...foundWordCells }
          for (const [r, c] of pw.cells) {
            newFoundCells.add(cellKey(r, c))
            newCellColors[cellKey(r, c)] = color
          }
          setFoundCells(newFoundCells)
          setFoundWordCells(newCellColors)
          setFoundWordColors((prev) => ({ ...prev, [pw.word]: color }))

          // Find feedback
          const entry = words.find((w) => w.word.toUpperCase() === pw.word)
          showFeedback(entry?.feedback || "Correcto!", true)

          // Check if all words found
          if (newFound.size === placedWords.length) {
            setTimeout(() => finishGame(), 2000)
          }
          return
        }
      }
    }

    // Wrong selection
    setWrongAttempts((p) => p + 1)
    const wrongSet = new Set(cells.map(([r, c]) => cellKey(r, c)))
    setWrongCells(wrongSet)
    showFeedback("Esa seleccion no corresponde a ninguna palabra de la lista. Sigue intentando!", false)
    setTimeout(() => setWrongCells(new Set()), 800)
  }, [grid, placedWords, foundWords, foundCells, foundWordCells, words, showFeedback])

  // Touch/mouse handlers for grid
  const getCellFromEvent = (e: React.TouchEvent | React.MouseEvent): [number, number] | null => {
    if (!gridRef.current) return null
    const rect = gridRef.current.getBoundingClientRect()
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
    const x = clientX - rect.left
    const y = clientY - rect.top
    const cellSize = rect.width / GRID_SIZE
    const col = Math.floor(x / cellSize)
    const row = Math.floor(y / cellSize)
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null
    return [row, col]
  }

  const isInLine = (cells: [number, number][], newCell: [number, number]): boolean => {
    if (cells.length === 0) return true
    if (cells.length === 1) return true

    const [r0, c0] = cells[0]
    const [r1, c1] = cells[1]
    const dr = Math.sign(r1 - r0)
    const dc = Math.sign(c1 - c0)
    const [nr, nc] = newCell
    const drNew = nr - r0 === 0 ? 0 : Math.sign(nr - r0)
    const dcNew = nc - c0 === 0 ? 0 : Math.sign(nc - c0)

    return dr === drNew && dc === dcNew
  }

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    const cell = getCellFromEvent(e)
    if (!cell) return
    setSelecting(true)
    setSelectedCells([cell])
  }

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!selecting) return
    e.preventDefault()
    const cell = getCellFromEvent(e)
    if (!cell) return

    const [r, c] = cell
    const lastCell = selectedCells[selectedCells.length - 1]
    if (lastCell && lastCell[0] === r && lastCell[1] === c) return

    // Check if cell is already selected
    if (selectedCells.some(([sr, sc]) => sr === r && sc === c)) return

    // Ensure straight line
    if (selectedCells.length >= 2 && !isInLine(selectedCells, cell)) return

    // Ensure adjacent to last cell
    if (lastCell) {
      const dr = Math.abs(r - lastCell[0])
      const dc = Math.abs(c - lastCell[1])
      if (dr > 1 || dc > 1) return
    }

    setSelectedCells((prev) => [...prev, cell])
  }

  const handleEnd = () => {
    if (selecting && selectedCells.length >= 2) {
      checkSelection(selectedCells)
    }
    setSelecting(false)
    setSelectedCells([])
  }

  const finishGame = async () => {
    let earnedStars = 0
    if (wrongAttempts === 0) earnedStars = 3
    else if (wrongAttempts <= 3) earnedStars = 2
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
        .eq("game_type", "wordsearch")
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
        game_type: "wordsearch",
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
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
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
        ? "Sigue asi! Cada palabra encontrada representa un concepto importante sobre lactancia."
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
            Encontraste todas las palabras con {wrongAttempts} error{wrongAttempts !== 1 ? "es" : ""}
          </p>

          <div className="text-left space-y-2 bg-emerald-50 rounded-xl p-3 max-h-28 overflow-y-auto">
            <p className="text-xs font-bold text-emerald-700 mb-2">Palabras encontradas:</p>
            {words.map((w) => (
              <div key={w.word} className="flex items-start gap-2">
                <Check size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-emerald-800">{w.displayName}</p>
                  <p className="text-xs text-emerald-600 leading-relaxed">{w.feedback}</p>
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

  const selectedCellKeys = new Set(selectedCells.map(([r, c]) => cellKey(r, c)))

  return (
    <div
      className="min-h-screen p-2 sm:p-3 md:p-6 overflow-x-hidden"
      style={backgroundImage ? {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      } : undefined}
    >
      <MusicControl track="trance" volume={0.25} />
      <div className="max-w-lg mx-auto space-y-3 w-full">

        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
          <p className="text-xs text-muted-foreground">{question}</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-muted-foreground">
              Encontradas: {foundWords.size} / {placedWords.length}
            </span>
            {wrongAttempts > 0 && (
              <span className="text-xs text-red-500">Errores: {wrongAttempts}</span>
            )}
          </div>
        </div>

        {/* Word list */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
          <p className="text-xs font-bold text-foreground mb-2">Palabras a buscar:</p>
          <div className="flex flex-wrap gap-2">
            {words.map((w) => {
              const isFound = foundWords.has(w.word.toUpperCase())
              const color = foundWordColors[w.word.toUpperCase()]
              return (
                <span
                  key={w.word}
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${
                    isFound
                      ? `${color || "bg-emerald-200"} text-emerald-800 line-through`
                      : "bg-muted text-foreground"
                  }`}
                >
                  {w.displayName}
                </span>
              )
            })}
          </div>
        </div>

        {/* Feedback */}
        {feedback.visible && (
          <div className={`flex items-start gap-3 p-3 rounded-2xl shadow-lg animate-in slide-in-from-top-4 duration-300 ${
            feedback.isCorrect ? "bg-green-50 border-2 border-green-300" : "bg-red-50 border-2 border-red-300"
          }`}>
            <Image src={mascotImage} alt="Mascota" width={40} height={40} className="object-contain flex-shrink-0" />
            <p className={`text-xs leading-relaxed flex-1 ${feedback.isCorrect ? "text-green-700" : "text-red-700"}`}>
              {feedback.message}
            </p>
            <button onClick={() => setFeedback((p) => ({ ...p, visible: false }))} className="flex-shrink-0 p-1">
              <X size={14} className="text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Grid */}
        <div className="relative rounded-2xl overflow-hidden shadow-xl border-2 sm:border-4 border-white/60 w-full max-w-full">
          {gridBackgroundImage && (
            <div className="absolute inset-0 z-0">
              <Image
                src={gridBackgroundImage}
                alt=""
                fill
                className="object-cover opacity-90"
                sizes="(max-width: 768px) 100vw, 500px"
              />
            </div>
          )}
          <div
            ref={gridRef}
            className="relative z-10 grid select-none touch-none"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          >
            {grid.map((row, r) =>
              row.map((letter, c) => {
                const key = cellKey(r, c)
                const isSelected = selectedCellKeys.has(key)
                const isFound = foundCells.has(key)
                const isWrong = wrongCells.has(key)
                const foundColor = foundWordCells[key]

                return (
                  <div
                    key={key}
                    className={`aspect-square flex items-center justify-center text-[10px] sm:text-xs md:text-sm font-bold transition-all duration-150 cursor-pointer ${
                      isFound
                        ? `${foundColor || "bg-emerald-300/60"} text-foreground`
                        : isSelected
                        ? "bg-teal-400/50 text-foreground scale-110"
                        : isWrong
                        ? "bg-red-400/50 text-foreground"
                        : "bg-white/70 text-foreground hover:bg-teal-100/50"
                    }`}
                  >
                    {letter}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Instruction */}
        <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
          <Image src={mascotImage} alt="Mascota" width={40} height={40} className="object-contain flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Desliza el dedo o arrastra el mouse sobre las letras para seleccionar las palabras ocultas en la sopa de letras.
          </p>
        </div>

        {/* Exit button */}
        <Button onClick={() => router.push("/game")} variant="outline" className="w-full rounded-xl bg-white/90">
          Salir
        </Button>

      </div>
    </div>
  )
}

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DragDropGame } from "@/components/drag-drop-game"

const levelData = {
  1: {
    title: "Beneficios del Bebé",
    question: "Arrastra los beneficios de la lactancia materna para el bebé:",
    correctAnswers: [
      "Fortalece el sistema inmunológico",
      "Mejora el desarrollo cerebral",
      "Reduce riesgo de infecciones",
      "Favorece el vínculo madre-hijo",
    ],
    incorrectAnswers: ["Causa caries dental", "Aumenta el riesgo de alergias", "Dificulta la digestión"],
  },
  2: {
    title: "Beneficios de la Mamá",
    question: "Arrastra los beneficios de la lactancia materna para la madre:",
    correctAnswers: [
      "Reduce el riesgo de cáncer de mama",
      "Ayuda a recuperar el peso",
      "Fortalece el vínculo emocional",
      "Reduce el sangrado postparto",
    ],
    incorrectAnswers: ["Causa osteoporosis", "Aumenta el riesgo de depresión", "Debilita el sistema inmune"],
  },
  3: {
    title: "Mitos y Realidades",
    question: "Arrastra las VERDADES sobre la lactancia materna:",
    correctAnswers: [
      "La leche materna cambia según las necesidades del bebé",
      "Se puede amamantar hasta los 2 años o más",
      "El calostro es muy nutritivo",
      "Es el mejor alimento para el bebé",
    ],
    incorrectAnswers: [
      "La leche materna pierde valor después de 6 meses",
      "Hay madres que no producen suficiente leche",
      "Amamantar duele siempre",
    ],
  },
}

export default async function LevelPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const levelId = Number.parseInt(id)
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const level = levelData[levelId as keyof typeof levelData]
  if (!level) {
    redirect("/game")
  }

  return (
    <DragDropGame
      levelId={levelId}
      userId={data.user.id}
      title={level.title}
      question={level.question}
      correctAnswers={level.correctAnswers}
      incorrectAnswers={level.incorrectAnswers}
    />
  )
}

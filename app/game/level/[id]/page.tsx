import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DragDropGame } from "@/components/drag-drop-game"

const levelData = {
  1: {
    title: "Beneficios del Bebé",
    question: "Arrastra los beneficios de la lactancia materna para el bebé:",
    correctAnswers: [
      { text: "Fortalece el sistema inmunológico", image: "/images/options/sistema-inmune.png" },
      { text: "Mejora el desarrollo cerebral", image: "/images/options/desarrollo-cerebral.png" },
      { text: "Reduce riesgo de infecciones", image: "/images/options/reduce-infecciones.png" },
      { text: "Favorece el vínculo madre-hijo", image: "/images/options/vinculo-emocional.png" },
      { text: "Mejora la digestión", image: "/images/options/estomago-feliz.png" },
    ],
    incorrectAnswers: [
      { text: "Causa caries dental", image: "/images/options/dulce-caries.png" },
      { text: "Alimentación con biberón", image: "/images/options/biberon.png" },
      { text: "Bebidas artificiales", image: "/images/options/bebida-artificial.png" },
    ],
    backgroundImage: "/images/fondo_2.png",
    dropZoneImage: "/images/Mama.png",
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
      backgroundImage={"backgroundImage" in level ? level.backgroundImage : undefined}
      dropZoneImage={"dropZoneImage" in level ? level.dropZoneImage : undefined}
    />
  )
}

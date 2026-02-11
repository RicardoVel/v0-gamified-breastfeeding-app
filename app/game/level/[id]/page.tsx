import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DragDropGame } from "@/components/drag-drop-game"
import { ClassifyGame } from "@/components/classify-game"

const levelData = {
  1: {
    title: "Beneficios del Bebe",
    question: "Arrastra los beneficios de la lactancia materna para el bebe:",
    correctAnswers: [
      { text: "Fortalece el sistema inmunologico", image: "/images/options/sistema-inmune.png", feedback: "La leche materna contiene anticuerpos que protegen al bebe de enfermedades e infecciones." },
      { text: "Mejora el desarrollo cerebral", image: "/images/options/desarrollo-cerebral.png", feedback: "Los acidos grasos de la leche materna, como el DHA, favorecen el desarrollo del cerebro del bebe." },
      { text: "Reduce riesgo de infecciones", image: "/images/options/reduce-infecciones.png", feedback: "La lactancia materna reduce significativamente el riesgo de infecciones respiratorias y gastrointestinales." },
      { text: "Favorece el vinculo madre-hijo", image: "/images/options/vinculo-emocional.png", feedback: "El contacto piel a piel durante la lactancia fortalece el lazo emocional entre mama y bebe." },
      { text: "Mejora la digestion", image: "/images/options/estomago-feliz.png", feedback: "La leche materna es facilmente digerible y contiene enzimas que ayudan a la digestion del bebe." },
    ],
    incorrectAnswers: [
      { text: "Causa caries dental", image: "/images/options/dulce-caries.png", feedback: "Los dulces y azucares causan caries, no la leche materna. La lactancia no dana los dientes del bebe." },
      { text: "Alimentacion con biberon", image: "/images/options/biberon.png", feedback: "El biberon no es un beneficio de la lactancia materna. La leche materna se ofrece directamente del pecho." },
      { text: "Bebidas artificiales", image: "/images/options/bebida-artificial.png", feedback: "Las bebidas artificiales no son un beneficio. La leche materna es el alimento mas completo y natural." },
    ],
    backgroundImage: "/images/fondo_2.png",
    dropZoneImage: "/images/Mama.png",
  },
  2: {
    gameType: "classify" as const,
    title: "Mitos y Verdades",
    question: "Clasifica cada concepto: es un MITO o una VERDAD sobre la lactancia?",
    backgroundImage: "/images/fondo_2.png",
    classifyItems: [
      // VERDADES - cartas con beneficios reales
      { text: "Previene la depresion postparto", image: "/images/cards/prevenir-depresion.png", category: "verdad" as const, feedback: "Correcto! La lactancia libera oxitocina y prolactina que ayudan a prevenir la depresion postparto." },
      { text: "Menor riesgo de osteoporosis", image: "/images/cards/riesgo-osteoporosis.png", category: "verdad" as const, feedback: "Correcto! Aunque se pierde calcio temporalmente, la lactancia a largo plazo protege contra la osteoporosis." },
      { text: "Fortalece el vinculo emocional", image: "/images/cards/vinculo-emocional.png", category: "verdad" as const, feedback: "Correcto! El contacto piel a piel y la lactancia fortalecen el lazo emocional entre mama y bebe." },
      { text: "Ayuda a la recuperacion posparto", image: "/images/cards/recuperacion-posparto.png", category: "verdad" as const, feedback: "Correcto! La lactancia ayuda al utero a contraerse y a la mama a recuperar su peso mas rapido." },
      { text: "Reduce el riesgo de cancer", image: "/images/cards/prevencion-cancer.png", category: "verdad" as const, feedback: "Correcto! Estudios demuestran que amamantar reduce significativamente el riesgo de cancer de mama y ovario." },
      // MITOS - iconos negativos
      { text: "El biberon es igual de bueno", image: "/images/options/biberon.png", category: "mito" as const, feedback: "Esto es un mito! La leche materna tiene componentes vivos y anticuerpos que no se pueden replicar." },
      { text: "Los dulces en la dieta danan la leche", image: "/images/options/dulce-caries.png", category: "mito" as const, feedback: "Mito! La dieta de la mama no dana la leche. La leche materna siempre es nutritiva para el bebe." },
      { text: "Las bebidas frias cortan la leche", image: "/images/options/bebida-artificial.png", category: "mito" as const, feedback: "Mito! Las bebidas frias no afectan la produccion ni calidad de la leche materna." },
    ],
  },
  3: {
    title: "Mitos y Realidades",
    question: "Arrastra las VERDADES sobre la lactancia materna:",
    correctAnswers: [
      { text: "La leche materna cambia segun las necesidades del bebe", feedback: "La composicion de la leche se adapta a la edad, hora del dia y necesidades del bebe." },
      { text: "Se puede amamantar hasta los 2 anos o mas", feedback: "La OMS recomienda lactancia materna exclusiva hasta los 6 meses y complementaria hasta los 2 anos o mas." },
      { text: "El calostro es muy nutritivo", feedback: "El calostro es rico en anticuerpos y nutrientes esenciales, es la primera vacuna del bebe." },
      { text: "Es el mejor alimento para el bebe", feedback: "La leche materna contiene todos los nutrientes necesarios en las proporciones perfectas para el bebe." },
    ],
    incorrectAnswers: [
      { text: "La leche materna pierde valor despues de 6 meses", feedback: "Esto es falso. La leche sigue siendo nutritiva, pero se complementa con otros alimentos." },
      { text: "Hay madres que no producen suficiente leche", feedback: "La gran mayoria de madres produce suficiente leche. La produccion se regula por la demanda del bebe." },
      { text: "Amamantar duele siempre", feedback: "El dolor no es normal. Con un buen agarre y posicion, la lactancia no debe causar dolor." },
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

  // Classify game (Mitos vs Verdades)
  if ("gameType" in level && level.gameType === "classify") {
    return (
      <ClassifyGame
        levelId={levelId}
        userId={data.user.id}
        title={level.title}
        question={level.question}
        items={level.classifyItems}
        backgroundImage={"backgroundImage" in level ? level.backgroundImage : undefined}
      />
    )
  }

  // Default: Drag and Drop game
  return (
    <DragDropGame
      levelId={levelId}
      userId={data.user.id}
      title={level.title}
      question={"question" in level ? level.question : ""}
      correctAnswers={"correctAnswers" in level ? level.correctAnswers : []}
      incorrectAnswers={"incorrectAnswers" in level ? level.incorrectAnswers : []}
      backgroundImage={"backgroundImage" in level ? level.backgroundImage : undefined}
      dropZoneImage={"dropZoneImage" in level ? level.dropZoneImage : undefined}
    />
  )
}

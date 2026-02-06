import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DragDropGame } from "@/components/drag-drop-game"

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
    title: "Beneficios de la Mama",
    question: "Arrastra los beneficios de la lactancia materna para la madre:",
    correctAnswers: [
      { text: "Reduce el riesgo de cancer de mama", feedback: "Estudios demuestran que amamantar reduce el riesgo de cancer de mama y ovario." },
      { text: "Ayuda a recuperar el peso", feedback: "La produccion de leche consume calorias extra, ayudando a la mama a recuperar su peso." },
      { text: "Fortalece el vinculo emocional", feedback: "La oxitocina liberada durante la lactancia fortalece el amor y conexion con el bebe." },
      { text: "Reduce el sangrado postparto", feedback: "La lactancia estimula contracciones uterinas que ayudan a reducir el sangrado despues del parto." },
    ],
    incorrectAnswers: [
      { text: "Causa osteoporosis", feedback: "Esto es un mito. Aunque se pierde calcio durante la lactancia, se recupera al destetar." },
      { text: "Aumenta el riesgo de depresion", feedback: "Al contrario, la lactancia libera hormonas que ayudan a prevenir la depresion postparto." },
      { text: "Debilita el sistema inmune", feedback: "La lactancia no debilita a la mama. Su cuerpo se adapta para nutrir al bebe sin afectar su salud." },
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

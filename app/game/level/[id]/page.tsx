import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DragDropGame } from "@/components/drag-drop-game"
import { ClassifyGame } from "@/components/classify-game"
import { MatchingGame } from "@/components/matching-game"
import { LabelGame } from "@/components/label-game"
import { MemoryGame } from "@/components/memory-game"
import { OrderStepsGame } from "@/components/order-steps-game"
import { WordSearchGame } from "@/components/word-search-game"
import { TrueFalseGame } from "@/components/true-false-game"

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
      // VERDADES - iconos con beneficios reales de la lactancia
      { text: "Previene la depresion postparto", image: "/images/icons/depresion-posparto.png", category: "verdad" as const, feedback: "La lactancia libera oxitocina y prolactina, hormonas que ayudan a prevenir la depresion postparto y fortalecen el bienestar emocional de la mama." },
      { text: "Menor riesgo de osteoporosis", image: "/images/icons/osteoporosis.png", category: "verdad" as const, feedback: "Aunque se pierde calcio temporalmente durante la lactancia, el cuerpo lo recupera despues del destete, y a largo plazo la lactancia protege contra la osteoporosis." },
      { text: "Fortalece el vinculo emocional", image: "/images/icons/vinculo-emocional.png", category: "verdad" as const, feedback: "El contacto piel a piel y la lactancia liberan oxitocina, la hormona del amor, fortaleciendo el lazo emocional entre mama y bebe." },
      { text: "Ayuda a la recuperacion posparto", image: "/images/icons/recuperacion-posparto.png", category: "verdad" as const, feedback: "La lactancia estimula las contracciones uterinas que ayudan al utero a volver a su tamano normal y consume calorias extra que ayudan a la mama a recuperar su peso." },
      { text: "Reduce el riesgo de cancer", image: "/images/icons/prevencion-cancer.png", category: "verdad" as const, feedback: "Multiples estudios demuestran que amamantar reduce significativamente el riesgo de cancer de mama y de ovario en la madre." },
      // MITOS - conceptos falsos comunes sobre la lactancia
      { text: "Mi madre no pudo dar pecho, yo tampoco podre", image: "/images/icons/mama-no-podra.png", category: "mito" as const, feedback: "La capacidad de amamantar no es hereditaria. La gran mayoria de las mujeres pueden producir leche materna, independientemente de la experiencia de sus madres." },
      { text: "El ejercicio afecta el sabor de la leche", image: "/images/icons/ejercicio-sabor-leche.png", category: "mito" as const, feedback: "El ejercicio moderado no cambia el sabor ni la calidad de la leche materna. Las mamas activas pueden amamantar sin ninguna preocupacion." },
      { text: "Si te duele, no debes amamantar", image: "/images/icons/dolor-no-amamantar.png", category: "mito" as const, feedback: "El dolor al amamantar generalmente indica un mal agarre o posicion. Con la tecnica correcta y apoyo profesional, la lactancia no debe doler." },
      { text: "La lactancia te hace engordar", image: "/images/icons/amamantar-subir-peso.png", category: "mito" as const, feedback: "Al contrario, la lactancia consume entre 300 y 500 calorias diarias extra, lo que ayuda a muchas madres a perder el peso ganado durante el embarazo." },
      { text: "Con fiebre no debes amamantar", image: "/images/icons/fiebre-no-amamantar.png", category: "mito" as const, feedback: "Cuando la mama tiene fiebre, su leche produce anticuerpos que protegen al bebe. Seguir amamantando es lo mejor para la salud del bebe." },
    ],
  },
  3: {
    gameType: "matching" as const,
    title: "Posiciones de Lactancia",
    question: "Identifica el nombre correcto de cada posicion para amamantar",
    backgroundImage: "/images/fondo_3.png",
    matchingPairs: [
      { name: "Posicion de Cuna", image: "/images/posiciones/cuna.jpg", feedback: "En la posicion de cuna, la mama sostiene al bebe con el brazo del mismo lado del pecho. El bebe descansa sobre el antebrazo, con su cabeza en el pliegue del codo." },
      { name: "Posicion de Gemelos", image: "/images/posiciones/gemelos.jpg", feedback: "La posicion de gemelos o doble balon permite amamantar a dos bebes al mismo tiempo. Cada bebe se coloca bajo un brazo de la mama, con sus cuerpos hacia atras." },
      { name: "Posicion Cruzada", image: "/images/posiciones/cruzada.jpeg", feedback: "En la posicion cruzada, la mama sostiene al bebe con el brazo contrario al pecho que ofrece. Esto permite mayor control de la cabeza del bebe para un mejor agarre." },
      { name: "Posicion Acostada", image: "/images/posiciones/acostado.jpg", feedback: "En la posicion acostada de lado, mama y bebe se recuestan frente a frente. Es ideal para las tomas nocturnas o despues de una cesarea." },
    ],
  },
  4: {
    gameType: "label" as const,
    title: "Agarre Correcto",
    question: "Coloca cada etiqueta en la zona correcta del agarre",
    backgroundImage: "/images/fondo_3.png",
    diagramImage: "/images/nivel4/agarre-limpio.png",
    labelZones: [
      { id: "boca", label: "Boca bien abierta", x: 28, y: 22, feedback: "El bebe debe abrir bien la boca para lograr un agarre profundo que abarque gran parte de la areola, no solo el pezon." },
      { id: "areola", label: "Abarca gran parte de la areola", x: 62, y: 38, feedback: "Un buen agarre cubre la mayor parte de la areola. Se debe ver mas areola por arriba de la boca del bebe que por abajo." },
      { id: "barbilla", label: "Barbilla tocando el pecho", x: 65, y: 60, feedback: "La barbilla del bebe debe estar firmemente pegada al pecho de la mama. Esto asegura un agarre profundo y efectivo." },
      { id: "nariz", label: "Nariz despejada", x: 68, y: 50, feedback: "La nariz del bebe debe quedar libre y despejada para poder respirar con facilidad mientras amamanta." },
      { id: "sosten", label: "Sosten en C", x: 70, y: 78, feedback: "La mama sostiene el pecho con la mano en forma de C: el pulgar arriba y los demas dedos abajo, sin presionar la areola." },
    ],
  },
  5: {
    gameType: "memory" as const,
    title: "Dolor y Grietas del Pezon",
    question: "Encuentra las parejas: relaciona cada imagen con su solucion",
    backgroundImage: "/images/fondo_5.png",
    memoryPairs: [
      { id: "agarre", text: "Ajustar agarre", image: "/images/nivel5/ajustar-agarre.jpg", feedback: "Un buen agarre es la clave para prevenir el dolor. El bebe debe tomar gran parte de la areola, no solo el pezon, con la boca bien abierta." },
      { id: "lubricar", text: "Aplicar una gota de leche para lubricar (antes y despues de amamantar)", image: "/images/nivel5/lubricar-pezon.jpg", feedback: "La propia leche materna tiene propiedades cicatrizantes y antibacterianas. Aplicar una gota antes y despues de cada toma protege y ayuda a sanar el pezon." },
      { id: "formar", text: "Formar el pezon como si le subieran el volumen a la radio", image: "/images/nivel5/formar-pezon.jpg", feedback: "Esta tecnica ayuda a evertir el pezon para facilitar el agarre del bebe. Se gira suavemente con los dedos indice y pulgar, como si se girara la perilla de una radio." },
    ],
  },
  6: {
    gameType: "order" as const,
    title: "Pasos para la Congestion Mamaria",
    question: "Ordena los pasos correctos para aliviar la congestion mamaria",
    backgroundImage: "/images/fondo_6.png",
    orderSteps: [
      { id: "calor", text: "Aplicar calor local", correctOrder: 1, feedback: "El calor ayuda a dilatar los conductos de leche y facilita que la leche fluya con mayor facilidad antes de la toma." },
      { id: "extraer", text: "Extraer un poco de leche", correctOrder: 2, feedback: "Extraer un poco de leche manualmente o con sacaleches alivia la presion y ablanda la areola, facilitando el agarre del bebe." },
      { id: "amamantar", text: "Amamantar al bebe", correctOrder: 3, feedback: "Una vez que el pecho esta mas blando, el bebe puede agarrarse mejor y vaciar el pecho de forma efectiva, aliviando la congestion." },
      { id: "frio", text: "Aplicar frio local", correctOrder: 4, feedback: "El frio despues de amamantar reduce la inflamacion y el dolor. Se aplica con compresas frias o bolsas de gel por 15-20 minutos." },
    ],
  },
  7: {
    gameType: "wordsearch" as const,
    title: "Sopa de Letras: Cuidados Mamarios",
    question: "Encuentra las palabras ocultas relacionadas con el cuidado mamario",
    backgroundImage: "/images/fondo_6.png",
    gridBackgroundImage: "/images/nivel7/fondo-sopa.png",
    searchWords: [
      { word: "MASAJE", displayName: "Masaje", feedback: "El masaje suave en el pecho antes de amamantar ayuda a estimular el flujo de leche y prevenir obstrucciones en los conductos." },
      { word: "EXTRACCION", displayName: "Extraccion", feedback: "La extraccion de leche (manual o con sacaleches) ayuda a aliviar la congestion, mantener la produccion y crear un banco de leche." },
      { word: "HIDRATACION", displayName: "Hidratacion", feedback: "Mantenerse bien hidratada es esencial para la produccion de leche. Se recomienda beber al menos 2 litros de agua al dia." },
      { word: "COMPRESAS", displayName: "Compresas frias", feedback: "Las compresas frias aplicadas despues de amamantar ayudan a reducir la inflamacion y aliviar el dolor en pechos congestionados." },
      { word: "DIETA", displayName: "Dieta adecuada", feedback: "Una dieta equilibrada y nutritiva es fundamental para la mama lactante, asegurando que la leche contenga todos los nutrientes necesarios." },
    ],
  },
  8: {
    gameType: "truefalse" as const,
    title: "Verdadero o Falso: Mastitis",
    question: "Marca cada frase como verdadera o falsa",
    backgroundImage: "/images/fondo_8.png",
    tfStatements: [
      { id: "mastitis-dejar", text: "La mastitis siempre obliga a dejar de amamantar", isTrue: false, feedback: "La mastitis NO obliga a dejar de amamantar. De hecho, es recomendable seguir amamantando para ayudar a drenar el pecho y aliviar la inflamacion." },
      { id: "amamantar-desinflama", text: "Amamantar ayuda a desinflamar el pecho", isTrue: true, feedback: "Amamantar con frecuencia del pecho afectado ayuda a vaciarlo, lo que reduce la inflamacion y acelera la recuperacion de la mastitis." },
      { id: "dolor-suspender", text: "El dolor es senal de que debo suspender la lactancia", isTrue: false, feedback: "El dolor indica que algo debe corregirse (agarre, posicion, frecuencia), pero suspender la lactancia puede empeorar la mastitis al acumular mas leche." },
      { id: "sin-absceso", text: "Puedo seguir amamantando si no hay absceso", isTrue: true, feedback: "Mientras no haya un absceso que requiera drenaje quirurgico, es seguro y beneficioso continuar amamantando con mastitis." },
      { id: "fiebre-bebe", text: "La fiebre en el bebe es por la mastitis", isTrue: false, feedback: "La mastitis causa fiebre en la mama, no en el bebe. Si el bebe tiene fiebre, se debe a otra causa y requiere evaluacion pediatrica independiente." },
    ],
  },
  9: {
    title: "Nutricion Materna",
    question: "Arrastra los consejos de nutricion CORRECTOS para la mama lactante:",
    backgroundImage: "/images/fondo_2.png",
    correctAnswers: [
      { text: "Beber abundante agua durante el dia", feedback: "La hidratacion es clave. La mama necesita liquidos extra para producir leche, al menos 2 litros diarios." },
      { text: "Comer una dieta variada y equilibrada", feedback: "Una dieta balanceada asegura que la leche contenga todos los nutrientes que el bebe necesita." },
      { text: "Consumir alimentos ricos en calcio", feedback: "El calcio es esencial durante la lactancia. Lacteos, verduras de hoja verde y frutos secos son buenas fuentes." },
      { text: "Comer porciones extras saludables", feedback: "La mama lactante necesita aproximadamente 500 calorias extra al dia para producir leche de calidad." },
    ],
    incorrectAnswers: [
      { text: "Hacer dietas estrictas para bajar de peso rapido", feedback: "Las dietas muy restrictivas pueden reducir la produccion de leche y privar al bebe de nutrientes importantes." },
      { text: "Evitar completamente el cafe y el chocolate", feedback: "Se puede consumir cafe y chocolate con moderacion (1-2 tazas al dia). Solo se debe evitar el exceso." },
      { text: "Tomar cerveza para producir mas leche", feedback: "El alcohol no aumenta la produccion de leche. Al contrario, puede pasar al bebe y afectar su desarrollo." },
    ],
  },
  10: {
    gameType: "classify" as const,
    title: "Experta en Lactancia",
    question: "Demuestra todo lo aprendido: clasifica VERDAD o MITO",
    backgroundImage: "/images/fondo_2.png",
    classifyItems: [
      { text: "La lactancia materna es la mejor vacuna del bebe", category: "verdad" as const, feedback: "El calostro y la leche materna contienen anticuerpos unicos que protegen al bebe desde su primer dia de vida." },
      { text: "La lactancia reduce el riesgo de SIDS (muerte subita)", category: "verdad" as const, feedback: "Estudios demuestran que la lactancia materna reduce hasta un 50% el riesgo de sindrome de muerte subita infantil." },
      { text: "El bebe regula naturalmente cuanta leche necesita", category: "verdad" as const, feedback: "Los bebes amamantados aprenden a autorregularse, comiendo la cantidad exacta que necesitan." },
      { text: "La lactancia ahorra dinero a la familia", category: "verdad" as const, feedback: "La formula es costosa. La lactancia materna es gratuita y reduce gastos medicos por enfermedades prevenidas." },
      { text: "Los bebes amamantados son mas inteligentes siempre", category: "mito" as const, feedback: "La lactancia favorece el desarrollo cerebral, pero la inteligencia depende de muchos factores como estimulacion y genetica." },
      { text: "Despues de una cesarea no se puede amamantar", category: "mito" as const, feedback: "Se puede amamantar despues de una cesarea. La posicion de balon o acostada ayudan a evitar molestias." },
      { text: "Si la mama se enferma debe dejar de amamantar", category: "mito" as const, feedback: "En la mayoria de enfermedades comunes, la mama puede seguir amamantando. Su leche pasa anticuerpos al bebe." },
      { text: "La leche materna de una mama vegetariana es incompleta", category: "mito" as const, feedback: "Con una dieta vegetariana bien planificada y suplementos de B12, la leche materna es perfectamente nutritiva." },
      { text: "Amamantar despues de los 12 meses ya no sirve", category: "mito" as const, feedback: "La leche materna sigue aportando nutrientes, anticuerpos y beneficios emocionales mas alla del primer ano." },
      { text: "La lactancia exclusiva protege contra alergias", category: "verdad" as const, feedback: "La lactancia exclusiva durante 6 meses reduce significativamente el riesgo de alergias y asma en el bebe." },
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

  // True/False game (Mastitis)
  if ("gameType" in level && level.gameType === "truefalse") {
    return (
      <TrueFalseGame
        levelId={levelId}
        userId={data.user.id}
        title={level.title}
        question={level.question}
        statements={level.tfStatements}
        backgroundImage={"backgroundImage" in level ? level.backgroundImage : undefined}
      />
    )
  }

  // Word search game (Sopa de Letras)
  if ("gameType" in level && level.gameType === "wordsearch") {
    return (
      <WordSearchGame
        levelId={levelId}
        userId={data.user.id}
        title={level.title}
        question={level.question}
        words={level.searchWords}
        gridBackgroundImage={"gridBackgroundImage" in level ? level.gridBackgroundImage : undefined}
        backgroundImage={"backgroundImage" in level ? level.backgroundImage : undefined}
      />
    )
  }

  // Order steps game (Congestion Mamaria)
  if ("gameType" in level && level.gameType === "order") {
    return (
      <OrderStepsGame
        levelId={levelId}
        userId={data.user.id}
        title={level.title}
        question={level.question}
        steps={level.orderSteps}
        backgroundImage={"backgroundImage" in level ? level.backgroundImage : undefined}
      />
    )
  }

  // Memory game (Dolor y Grietas)
  if ("gameType" in level && level.gameType === "memory") {
    return (
      <MemoryGame
        levelId={levelId}
        userId={data.user.id}
        title={level.title}
        question={level.question}
        pairs={level.memoryPairs}
        backgroundImage={"backgroundImage" in level ? level.backgroundImage : undefined}
      />
    )
  }

  // Label game (Agarre Correcto)
  if ("gameType" in level && level.gameType === "label") {
    return (
      <LabelGame
        levelId={levelId}
        userId={data.user.id}
        title={level.title}
        question={level.question}
        diagramImage={level.diagramImage}
        zones={level.labelZones}
        backgroundImage={"backgroundImage" in level ? level.backgroundImage : undefined}
      />
    )
  }

  // Matching game (Posiciones de Lactancia)
  if ("gameType" in level && level.gameType === "matching") {
    return (
      <MatchingGame
        levelId={levelId}
        userId={data.user.id}
        title={level.title}
        question={level.question}
        pairs={level.matchingPairs}
        backgroundImage={"backgroundImage" in level ? level.backgroundImage : undefined}
      />
    )
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

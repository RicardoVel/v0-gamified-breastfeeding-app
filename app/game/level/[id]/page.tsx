import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DragDropGame } from "@/components/drag-drop-game"
import { ClassifyGame } from "@/components/classify-game"
import { MatchingGame } from "@/components/matching-game"
import { LabelGame } from "@/components/label-game"

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
    title: "Alimentacion Complementaria",
    question: "Arrastra las practicas CORRECTAS de alimentacion complementaria:",
    backgroundImage: "/images/fondo_2.png",
    correctAnswers: [
      { text: "Iniciar a los 6 meses con alimentos blandos", feedback: "La OMS recomienda iniciar la alimentacion complementaria a los 6 meses, cuando el bebe muestra senales de estar listo." },
      { text: "Continuar la lactancia junto con los alimentos", feedback: "La leche materna sigue siendo importante. Se complementa con alimentos, no se reemplaza." },
      { text: "Introducir un alimento nuevo cada 3 dias", feedback: "Esto permite identificar posibles alergias o intolerancias a cada alimento nuevo." },
      { text: "Ofrecer variedad de frutas y verduras", feedback: "Una dieta variada asegura que el bebe reciba todos los nutrientes necesarios para su crecimiento." },
    ],
    incorrectAnswers: [
      { text: "Dar alimentos solidos desde los 3 meses", feedback: "Antes de los 6 meses el sistema digestivo del bebe no esta preparado. Solo necesita leche materna." },
      { text: "Agregar sal y azucar a las papillas", feedback: "Los bebes no necesitan sal ni azucar. Sus rinones no estan preparados para procesarlos." },
      { text: "Reemplazar la leche materna por jugos", feedback: "Los jugos no sustituyen la leche materna. Contienen mucho azucar y pocos nutrientes esenciales." },
    ],
  },
  6: {
    gameType: "classify" as const,
    title: "Problemas Comunes",
    question: "Clasifica: es una SOLUCION real o un MITO sobre problemas de lactancia?",
    backgroundImage: "/images/fondo_2.png",
    classifyItems: [
      { text: "Si hay grietas, revisar el agarre del bebe", category: "verdad" as const, feedback: "Las grietas casi siempre se deben a un mal agarre. Un profesional puede ayudar a corregir la posicion." },
      { text: "Aplicar leche materna sobre grietas ayuda a sanar", category: "verdad" as const, feedback: "La leche materna tiene propiedades antibacterianas y cicatrizantes que ayudan a sanar las grietas del pezon." },
      { text: "Amamantar frecuentemente previene la mastitis", category: "verdad" as const, feedback: "Vaciar el pecho con frecuencia evita la acumulacion de leche que puede causar mastitis." },
      { text: "Consultar a un especialista en lactancia es util", category: "verdad" as const, feedback: "Los consultores de lactancia certificados pueden resolver la mayoria de los problemas con tecnicas adecuadas." },
      { text: "Si hay dolor, es mejor dejar de amamantar", category: "mito" as const, feedback: "El dolor indica un problema que se puede resolver. Dejar de amamantar no es la solucion, sino buscar ayuda profesional." },
      { text: "Los pechos pequenos producen menos leche", category: "mito" as const, feedback: "El tamano del pecho no determina la produccion. La leche se produce en las glandulas mamarias, no en la grasa." },
      { text: "El estres hace que la leche se corte", category: "mito" as const, feedback: "El estres puede retrasar temporalmente la bajada de leche, pero no la elimina. Relajarse y amamantar con frecuencia ayuda." },
      { text: "Hay que preparar los pezones antes del parto", category: "mito" as const, feedback: "No es necesario preparar los pezones. El cuerpo se prepara naturalmente durante el embarazo." },
    ],
  },
  7: {
    title: "Derechos de la Mama",
    question: "Arrastra los DERECHOS reales de la madre lactante:",
    backgroundImage: "/images/fondo_2.png",
    correctAnswers: [
      { text: "Derecho a amamantar en espacios publicos", feedback: "Amamantar en publico es un derecho protegido por la ley. Nadie puede prohibirte alimentar a tu bebe." },
      { text: "Derecho a tiempo de lactancia en el trabajo", feedback: "La ley garantiza pausas para amamantar o extraer leche durante la jornada laboral." },
      { text: "Derecho a un espacio adecuado para extraer leche", feedback: "Tu empleador debe proporcionarte un espacio privado, limpio y comodo, diferente al bano." },
      { text: "Derecho a informacion sobre lactancia", feedback: "Toda madre tiene derecho a recibir informacion clara y basada en evidencia sobre lactancia materna." },
    ],
    incorrectAnswers: [
      { text: "Obligacion de dejar de amamantar al ano", feedback: "No existe tal obligacion. La OMS recomienda amamantar hasta los 2 anos o mas si mama y bebe lo desean." },
      { text: "El padre decide cuando dejar la lactancia", feedback: "La decision de amamantar es de la madre y el bebe. Nadie mas debe imponer cuando terminar." },
      { text: "El pediatra puede prohibir la lactancia", feedback: "Son muy raras las condiciones medicas que impiden la lactancia. La mayoria de los medicamentos son compatibles." },
    ],
  },
  8: {
    gameType: "classify" as const,
    title: "Lactancia y Trabajo",
    question: "Clasifica: es un CONSEJO util o un MITO sobre lactancia y trabajo?",
    backgroundImage: "/images/fondo_2.png",
    classifyItems: [
      { text: "Crear un banco de leche antes de regresar al trabajo", category: "verdad" as const, feedback: "Extraer y congelar leche semanas antes permite tener reservas para cuando la mama no este presente." },
      { text: "La leche extraida dura hasta 6 horas a temperatura ambiente", category: "verdad" as const, feedback: "A temperatura ambiente (hasta 25 grados), la leche materna se conserva segura durante 4 a 6 horas." },
      { text: "Se puede congelar la leche hasta por 6 meses", category: "verdad" as const, feedback: "En un congelador a -18 grados, la leche materna se conserva de forma segura hasta 6 meses." },
      { text: "Extraerse leche en el trabajo mantiene la produccion", category: "verdad" as const, feedback: "Extraer leche con la misma frecuencia que el bebe mama ayuda a mantener la produccion estable." },
      { text: "Al volver al trabajo hay que dejar de amamantar", category: "mito" as const, feedback: "Muchas mamas combinan exitosamente el trabajo con la lactancia. La extraccion de leche es clave." },
      { text: "La leche congelada pierde todos sus nutrientes", category: "mito" as const, feedback: "La leche congelada conserva la mayoria de sus nutrientes y anticuerpos. Es mucho mejor que la formula." },
      { text: "Hay que calentar la leche en microondas", category: "mito" as const, feedback: "El microondas destruye nutrientes y puede crear puntos calientes peligrosos. Se calienta a bano maria." },
      { text: "Si se mezcla leche de distintas extracciones, se dana", category: "mito" as const, feedback: "Se puede mezclar leche de distintas extracciones del mismo dia, siempre que esten a la misma temperatura." },
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

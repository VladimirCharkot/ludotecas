import "server-only"
import { fetchSheetRange } from "@/lib/sheets"
import {
  columnLetter,
  ESCUELAS_COLUMNS,
  ESCUELAS_TAB,
  INSTITUCIONES_COLUMNS,
  INSTITUCIONES_TAB,
  LUDOTECAS_COLUMNS,
  LUDOTECAS_TAB,
} from "@/lib/consolidation/master-sheet"
import { buildPins } from "@/lib/map-pins"
import type { PublicPin } from "@/lib/map-types"
import { PublicMapView } from "./PublicMapView"
import FlyerRelevamiento from "@/public/assets/gacetilla/flyer-relevamiento.png"
import Image from "next/image"
import type { Metadata } from "next"

// Mismo criterio de cacheo que /admin/map: la planilla se actualiza a mano
// (bun run consolidate), tolera hasta 1h de latencia.
export const revalidate = 3600

export const metadata: Metadata = {
  title: "Relevamiento de Ludotecas Escolares",
  description:
    "Completá el formulario de relevamiento de ludotecas escolares y navegá el mapa con las respuestas que ya se sumaron a la red.",
  openGraph: {
    title: "Relevamiento de Ludotecas Escolares",
    description:
      "Completá el formulario de relevamiento de ludotecas escolares y navegá el mapa con las respuestas que ya se sumaron a la red.",
    images: [{ url: "/assets/gacetilla/flyer-relevamiento.png" }],
  },
}

// Instituciones que llegan por estos programas de Maestra no se muestran en
// el mapa público (aunque sí siguen en /admin/map). "fuentes" puede traer
// varias a la vez separadas por ";" -- alcanza con que incluya una excluida.
const FUENTES_EXCLUIDAS_DEL_MAPA_PUBLICO = [
  "PIBE",
  "PIE",
  // Circular 1 -- en evaluación. Si se confirma que sí forman parte de la
  // red, borrar estas dos líneas para que vuelvan a aparecer.
  "C1 Ludotecas",
  "C1 Programación",
]

function parseRows(
  values: string[][],
  columns: readonly string[]
): Record<string, string>[] {
  return values.map((row) =>
    Object.fromEntries(columns.map((c, i) => [c, row[i] ?? ""]))
  )
}

export default async function RelevamientoPage() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) throw new Error("Falta GOOGLE_MAPS_API_KEY")

  const spreadsheetId = process.env.MASTER_SPREADSHEET_ID
  if (!spreadsheetId) throw new Error("Falta MASTER_SPREADSHEET_ID")

  const [escuelaValues, institucionValues, ludotecaValues] = await Promise.all([
    fetchSheetRange(
      spreadsheetId,
      `${ESCUELAS_TAB}!A2:${columnLetter(ESCUELAS_COLUMNS.length)}`
    ),
    fetchSheetRange(
      spreadsheetId,
      `${INSTITUCIONES_TAB}!A2:${columnLetter(INSTITUCIONES_COLUMNS.length)}`
    ),
    fetchSheetRange(
      spreadsheetId,
      `${LUDOTECAS_TAB}!A2:${columnLetter(LUDOTECAS_COLUMNS.length)}`
    ),
  ])

  const escuelasByCue = new Map(
    parseRows(escuelaValues, ESCUELAS_COLUMNS).map((e) => [e.cue, e])
  )
  const instituciones = parseRows(institucionValues, INSTITUCIONES_COLUMNS)
  const ludotecasByRowIndex = new Map(
    parseRows(ludotecaValues, LUDOTECAS_COLUMNS).map((l) => [l.row_index, l])
  )

  const { pins: todosLosPines } = buildPins({
    instituciones,
    escuelasByCue,
    ludotecasByRowIndex,
  })

  // Se muestran todos los pines del mapa privado salvo los excluidos arriba,
  // pero sin ninguna de sus respuestas, datos de la institución/escuela, ni
  // distinción de categoría/fuente/programa -- ni aún al hacer click. Solo
  // se expone nombre y ubicación.
  const pins: PublicPin[] = todosLosPines
    .filter(
      (pin) => !pin.fuentes.some((f) => FUENTES_EXCLUIDAS_DEL_MAPA_PUBLICO.includes(f))
    )
    .map((pin) => ({
      id: pin.id,
      nombre: pin.nombre,
      lat: pin.lat,
      lng: pin.lng,
    }))

  return (
    <div className="mx-auto max-w-6xl my-16 px-4">
      <div className="flex flex-col gap-4 px-2 md:px-16 pb-8 text-lg md:text-xl">
        <div>
          <h2 className="font-barriecito pb-4 text-6xl text-center">
            Relevamiento de Ludotecas Escolares
          </h2>
          <p className="font-poppins pb-4 text-3xl text-center">
            ¡Ayudanos a completar el mapa!
          </p>
        </div>

        <Image src={FlyerRelevamiento} alt="Relevamiento ludotecas" />

        <hr />

        <p className="font-bold text-2xl">¡Hola! ✨</p>
        <p>
          Desde el programa Ludotecas, Ajedrez y Go invitamos a las{" "}
          <strong>ludotecas escolares</strong> completar este formulario para
          seguir <em>abriendo la ronda</em>, consolidando red y activando
          protagonismo.{" "}
        </p>
        <p>
          Además de darnos una perspectiva del collage extraordinario que
          hacemos y la posibilidad de entrar en contacto con experiencias
          afines, con el relevamiento podemos planificar mejor las propuestas de
          formación, acompañamiento y fortalecimiento de la red.
        </p>
        <p>
          Podés navegar el mapa más abajo para ver las respuestas que ya se
          enviaron... ¡quizás ya empezamos a ver motivos para el encuentro!
        </p>
        <p>Completá el formulario accediendo al siguiente link:</p>
        <p className="">
          <a
            className="text-blue-600 hover:text-blue-800 font-roboto-mono underline text-xl md:text-4xl"
            href="https://forms.gle/7NAPiRYF6wrXdzGK8"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://forms.gle/7NAPiRYF6wrXdzGK8
          </a>
        </p>
      </div>

      <hr className="py-6" />

      <h3 className="text-6xl font-barriecito mb-6 text-center">
        Mapa de Ludotecas Escolares 2026
      </h3>
      <PublicMapView apiKey={apiKey} pins={pins} />
    </div>
  )
}

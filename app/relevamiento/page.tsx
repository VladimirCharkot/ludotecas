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
import type { Pin } from "@/lib/map-types"
import {
  CAMPO_CONTACTO,
  CAMPOS_SOBRE_LUDOTECA,
} from "@/lib/relevamiento-fields"
import { PublicMapView } from "./PublicMapView"
import FlyerRelevamiento from "@/public/assets/gacetilla/flyer-relevamiento.png"
import Image from "next/image"

// Mismo criterio de cacheo que /admin/map: la planilla se actualiza a mano
// (bun run consolidate), tolera hasta 1h de latencia.
export const revalidate = 3600

// Pregunta de consentimiento del form -- solo se publican acá las
// respuestas de quienes contestaron "Sí" explícitamente. Dejar la pregunta
// en blanco o responder "Por ahora mejor no" excluye a esa ludoteca de esta
// página (pero sigue viendo en /admin/map).
const CONSENTIMIENTO_KEY =
  "¿Nos das permiso de compartir eventualmente algún extracto de tus respuestas o alguna foto en nuestro sitio web (ludotecaseducacion.co) con fines pedagógicos y de comunicación institucional (difusión de experiencias, materiales y registros del proyecto)?\n\nEl Ministerio no publica imágenes donde aparezcan rostros de estudiantes sin contar con las autorizaciones correspondientes de las familias o responsables."

function parseRows(
  values: string[][],
  columns: readonly string[]
): Record<string, string>[] {
  return values.map((row) =>
    Object.fromEntries(columns.map((c, i) => [c, row[i] ?? ""]))
  )
}

function tienePayload(pin: Pin): boolean {
  return Object.keys(pin.payload).length > 0
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

  // Solo relevamiento (respondieron el form) y con consentimiento explícito
  // para publicar; se descartan las etiquetas de programa (Maestra) y todo
  // el payload salvo el nombre de contacto y los 5 campos permitidos.
  const pins: Pin[] = todosLosPines
    .filter(
      (pin) =>
        tienePayload(pin) && pin.payload[CONSENTIMIENTO_KEY]?.trim() === "Sí"
    )
    .map((pin) => {
      const payload: Record<string, string> = {}
      if (pin.payload[CAMPO_CONTACTO])
        payload[CAMPO_CONTACTO] = pin.payload[CAMPO_CONTACTO]
      for (const campo of CAMPOS_SOBRE_LUDOTECA) {
        if (pin.payload[campo]) payload[campo] = pin.payload[campo]
      }
      return { ...pin, fuentes: [], payload }
    })

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

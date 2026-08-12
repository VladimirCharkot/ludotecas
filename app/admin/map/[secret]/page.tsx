import "server-only"
import { notFound } from "next/navigation"
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
import { MapView } from "./MapView"

// La planilla maestra se actualiza a mano (bun run consolidate); la página
// tolera hasta 1h de latencia, así que no necesita leerla en cada request.
export const revalidate = 3600

function parseRows(values: string[][], columns: readonly string[]): Record<string, string>[] {
  return values.map((row) => Object.fromEntries(columns.map((c, i) => [c, row[i] ?? ""])))
}

export default async function MapPage({
  params,
}: {
  params: Promise<{ secret: string }>
}) {
  const { secret } = await params
  const expected = process.env.ADMIN_REVIEW_SECRET
  if (!expected || secret !== expected) {
    notFound()
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) throw new Error("Falta GOOGLE_MAPS_API_KEY")

  const spreadsheetId = process.env.MASTER_SPREADSHEET_ID
  if (!spreadsheetId) throw new Error("Falta MASTER_SPREADSHEET_ID")

  const [escuelaValues, institucionValues, ludotecaValues] = await Promise.all([
    fetchSheetRange(spreadsheetId, `${ESCUELAS_TAB}!A2:${columnLetter(ESCUELAS_COLUMNS.length)}`),
    fetchSheetRange(
      spreadsheetId,
      `${INSTITUCIONES_TAB}!A2:${columnLetter(INSTITUCIONES_COLUMNS.length)}`
    ),
    fetchSheetRange(spreadsheetId, `${LUDOTECAS_TAB}!A2:${columnLetter(LUDOTECAS_COLUMNS.length)}`),
  ])

  const escuelasByCue = new Map(
    parseRows(escuelaValues, ESCUELAS_COLUMNS).map((e) => [e.cue, e])
  )
  const instituciones = parseRows(institucionValues, INSTITUCIONES_COLUMNS)
  // Las instituciones solo linkean al form por row_index — el payload en sí
  // (todas las respuestas del form) sigue viviendo en la tab Ludotecas.
  const ludotecasByRowIndex = new Map(
    parseRows(ludotecaValues, LUDOTECAS_COLUMNS).map((l) => [l.row_index, l])
  )

  const { pins, sinCoordenadas } = buildPins({
    instituciones,
    escuelasByCue,
    ludotecasByRowIndex,
  })

  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
      <h2 className="font-barriecito pb-4 text-4xl">Mapa de Ludotecas</h2>
      <MapView apiKey={apiKey} pins={pins} sinCoordenadas={sinCoordenadas} />
    </div>
  )
}

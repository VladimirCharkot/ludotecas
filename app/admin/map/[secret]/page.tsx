import "server-only"
import { notFound } from "next/navigation"
import { fetchSheetRange } from "@/lib/sheets"
import {
  columnLetter,
  ESCUELAS_COLUMNS,
  ESCUELAS_TAB,
  LUDOTECAS_COLUMNS,
  LUDOTECAS_TAB,
} from "@/lib/consolidation/master-sheet"
import { MapView } from "./MapView"
import type { Pin, SinCoordenadas } from "./types"

// La planilla maestra se actualiza a mano (bun run consolidate); la página
// tolera hasta 1h de latencia, así que no necesita leerla en cada request.
export const revalidate = 3600

function tieneEscuela(estado: string): boolean {
  return estado === "auto" || estado === "revision"
}

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

  const [escuelaValues, ludotecaValues] = await Promise.all([
    fetchSheetRange(spreadsheetId, `${ESCUELAS_TAB}!A2:${columnLetter(ESCUELAS_COLUMNS.length)}`),
    fetchSheetRange(spreadsheetId, `${LUDOTECAS_TAB}!A2:${columnLetter(LUDOTECAS_COLUMNS.length)}`),
  ])

  const escuelasByCue = new Map(
    parseRows(escuelaValues, ESCUELAS_COLUMNS).map((e) => [e.cue, e])
  )
  const ludotecas = parseRows(ludotecaValues, LUDOTECAS_COLUMNS)

  const pins: Pin[] = []
  const sinCoordenadas: SinCoordenadas[] = []

  for (const l of ludotecas) {
    const ludotecaId = Number(l.row_index)
    const payload = l.raw_payload ? (JSON.parse(l.raw_payload) as Record<string, string>) : {}

    const escuela = tieneEscuela(l.estado) ? escuelasByCue.get(l.match_cue) : undefined
    if (escuela && escuela.lat && escuela.lng) {
      pins.push({
        ludotecaId,
        nombre: l.nombre,
        localidad: l.localidad,
        departamento: l.departamento,
        lat: Number(escuela.lat),
        lng: Number(escuela.lng),
        color: l.estado === "auto" ? "auto" : "revision",
        escuela: {
          nombre: escuela.nombre,
          cue: escuela.cue,
          domicilio: escuela.domicilio,
          localidad: escuela.localidad,
          departamento: escuela.departamento,
          orientacion: escuela.orientacion || null,
        },
        payload,
      })
      continue
    }

    if (l.lat && l.lng) {
      pins.push({
        ludotecaId,
        nombre: l.nombre,
        localidad: l.localidad,
        departamento: l.departamento,
        lat: Number(l.lat),
        lng: Number(l.lng),
        color: "sin_escuela",
        escuela: null,
        payload,
      })
      continue
    }

    sinCoordenadas.push({
      ludotecaId,
      nombre: l.nombre,
      localidad: l.localidad,
      departamento: l.departamento,
    })
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
      <h2 className="font-barriecito pb-4 text-4xl">Mapa de Ludotecas</h2>
      <MapView apiKey={apiKey} pins={pins} sinCoordenadas={sinCoordenadas} />
    </div>
  )
}

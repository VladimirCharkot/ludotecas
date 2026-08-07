// Entrypoint único de la consolidación: lo llaman tanto scripts/consolidate.ts
// (CLI manual, standalone con `bun run`) como app/api/consolidate/route.ts
// (trigger manual por HTTP) — misma lógica, sin duplicar nada entre los dos.
// Por eso ni este archivo ni lo que importa puede tener "server-only" (ver
// nota en lib/google-auth.ts).
import { geocodeAddress } from "@/lib/geocoding"
import { resolveEntities, type ResolvableRecord } from "@/lib/matching/resolve"
import { LUDOTECA_TO_ESCUELA, SOURCES } from "@/config/consolidation"
import { buildEntityRows } from "./merge"
import {
  ESCUELAS_COLUMNS,
  ESCUELAS_TAB,
  isLocked,
  LUDOTECAS_COLUMNS,
  LUDOTECAS_TAB,
  readTab,
  writeTab,
} from "./master-sheet"

export interface ConsolidationSummary {
  ludotecas: number
  escuelasCandidatas: number
  escuelasPersistidas: number
  auto: number
  revision: number
  sinMatch: number
  geocodadas: number
}

function masterSpreadsheetId(): string {
  const id = process.env.MASTER_SPREADSHEET_ID
  if (!id) throw new Error("Falta MASTER_SPREADSHEET_ID")
  return id
}

function tieneEscuela(estado: string): boolean {
  return estado === "auto" || estado === "revision"
}

export async function runConsolidation(
  options: { dryRun?: boolean } = {}
): Promise<ConsolidationSummary> {
  const dryRun = options.dryRun ?? false

  // 1. Universo completo (en memoria) de escuelas candidatas, y las
  //    ludotecas del form — nunca se persiste el pool completo, solo se usa
  //    para el matching (ver paso 5, la sub-canónica que sí se persiste).
  const escuelaRows = await buildEntityRows("escuela", SOURCES)
  const ludotecaRows = await buildEntityRows("ludoteca", SOURCES)

  const escuelaRecords: ResolvableRecord[] = [...escuelaRows.entries()].map(([id, fields]) => ({
    id,
    fields,
  }))
  const ludotecaRecords: ResolvableRecord[] = [...ludotecaRows.entries()].map(([id, fields]) => ({
    id,
    fields,
  }))

  // 2. Matching ludoteca -> escuela.
  const result = resolveEntities(ludotecaRecords, escuelaRecords, LUDOTECA_TO_ESCUELA)
  const matchByLudotecaId = new Map(
    [...result.auto, ...result.revision].map((m) => [m.sourceId, m])
  )

  const spreadsheetId = masterSpreadsheetId()

  // 3. Leer la tab Ludotecas actual, para no pisar filas que un humano ya
  //    lockeó (estado = auto o rechazado).
  const { rows: existingLudotecas, rowCount: prevLudotecaCount } = await readTab(
    spreadsheetId,
    LUDOTECAS_TAB,
    LUDOTECAS_COLUMNS
  )
  const existingByRowIndex = new Map(existingLudotecas.map((r) => [r.row_index, r]))
  const lockedRowIndexes = new Set(
    existingLudotecas.filter((r) => isLocked(r.estado)).map((r) => r.row_index)
  )

  const now = new Date().toISOString()

  // 4. Recalcular todas las filas; las lockeadas se conservan tal cual.
  const mergedLudotecas = [...ludotecaRows.entries()].map(([rowIndex, fields]) => {
    const prev = existingByRowIndex.get(rowIndex)
    if (prev && lockedRowIndexes.has(rowIndex)) return prev

    const match = matchByLudotecaId.get(rowIndex)
    return {
      row_index: rowIndex,
      nombre: fields.nombre,
      localidad: fields.localidad,
      departamento: fields.departamento,
      cue: fields.cue,
      raw_payload: fields.raw_payload ?? "",
      match_cue: match?.targetId ?? "",
      match_metodo: match?.metodo ?? "",
      match_score: match ? match.score.toFixed(2) : "",
      estado: match?.estado ?? "",
      // Coordenadas a nivel ludoteca solo aplican cuando no hay escuela
      // resuelta (pin "sin_escuela" en el mapa, a nivel localidad).
      lat: !match && prev ? prev.lat : "",
      lng: !match && prev ? prev.lng : "",
      geocoded_at: !match && prev ? prev.geocoded_at : "",
      updated_at: now,
    }
  })

  // 5. Sub-canónica: solo se persisten las escuelas efectivamente
  //    referenciadas por una fila con estado auto/revision (lockeada o
  //    recién calculada) — no el padrón completo, que fue solo el pool de
  //    candidatos en memoria del paso 2.
  const referencedCues = new Set(
    mergedLudotecas
      .filter((r) => tieneEscuela(r.estado))
      .map((r) => r.match_cue)
      .filter((cue): cue is string => Boolean(cue))
  )

  const { rows: existingEscuelas } = await readTab(spreadsheetId, ESCUELAS_TAB, ESCUELAS_COLUMNS)
  const existingEscuelaByCue = new Map(existingEscuelas.map((r) => [r.cue, r]))

  const mergedEscuelas = [...referencedCues].map((cue) => {
    const fields = escuelaRows.get(cue)
    const prev = existingEscuelaByCue.get(cue)
    return {
      cue,
      nombre: fields?.nombre ?? prev?.nombre ?? "",
      localidad: fields?.localidad ?? prev?.localidad ?? "",
      departamento: fields?.departamento ?? prev?.departamento ?? "",
      domicilio: fields?.domicilio ?? prev?.domicilio ?? "",
      orientacion: fields?.orientacion ?? prev?.orientacion ?? "",
      lat: prev?.lat ?? "",
      lng: prev?.lng ?? "",
      geocoded_at: prev?.geocoded_at ?? "",
      updated_at: now,
    }
  })

  let geocodadas = 0
  if (!dryRun) {
    // 6. Geocodificar (cacheado) escuelas persistidas sin coordenadas.
    for (const escuela of mergedEscuelas) {
      if (escuela.lat) continue
      const address = [escuela.domicilio, escuela.localidad, escuela.departamento, "Córdoba", "Argentina"]
        .filter(Boolean)
        .join(", ")
      const coords = await geocodeAddress(address)
      if (coords) {
        escuela.lat = String(coords.lat)
        escuela.lng = String(coords.lng)
        escuela.geocoded_at = now
        geocodadas++
      }
    }

    // 7. Geocodificar (cacheado, a nivel localidad) ludotecas sin escuela
    //    resuelta (incluye sin_match y rechazado — ambos se muestran como
    //    pin "sin_escuela" en el mapa).
    for (const ludoteca of mergedLudotecas) {
      if (tieneEscuela(ludoteca.estado) || ludoteca.lat) continue
      const address = [ludoteca.localidad, ludoteca.departamento, "Córdoba", "Argentina"]
        .filter(Boolean)
        .join(", ")
      const coords = await geocodeAddress(address)
      if (coords) {
        ludoteca.lat = String(coords.lat)
        ludoteca.lng = String(coords.lng)
        ludoteca.geocoded_at = now
        geocodadas++
      }
    }

    // 8. Escribir ambas tabs (overwrite atómico, una sola llamada cada una).
    await writeTab(spreadsheetId, LUDOTECAS_TAB, LUDOTECAS_COLUMNS, mergedLudotecas, prevLudotecaCount)
    await writeTab(spreadsheetId, ESCUELAS_TAB, ESCUELAS_COLUMNS, mergedEscuelas, existingEscuelas.length)
  }

  return {
    ludotecas: ludotecaRecords.length,
    escuelasCandidatas: escuelaRecords.length,
    escuelasPersistidas: mergedEscuelas.length,
    auto: result.auto.length,
    revision: result.revision.length,
    sinMatch: result.sinMatch.length,
    geocodadas,
  }
}

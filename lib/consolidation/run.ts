// Entrypoint único de la consolidación: lo llaman tanto scripts/consolidate.ts
// (CLI manual, standalone con `bun run`) como app/api/consolidate/route.ts
// (trigger manual por HTTP) — misma lógica, sin duplicar nada entre los dos.
// Por eso ni este archivo ni lo que importa puede tener "server-only" (ver
// nota en lib/google-auth.ts).
import { geocodeAddress } from "@/lib/geocoding"
import { resolveEntities, type ResolvableRecord } from "@/lib/matching/resolve"
import {
  INSTITUCION_TO_ESCUELA,
  LUDOTECA_TO_ESCUELA,
  MAESTRA_2026,
  MAESTRA_TAB,
  SOURCES,
} from "@/config/consolidation"
import { buildEntityRows } from "./merge"
import { buildInstitucionGroups, isWritebackEligible, unifyWithLudotecas } from "./institucion"
import { writeResolvedCuesToMaestra } from "./maestra-writeback"
import {
  ESCUELAS_COLUMNS,
  ESCUELAS_TAB,
  INSTITUCIONES_COLUMNS,
  INSTITUCIONES_TAB,
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
  institucionesCandidatas: number
  institucionesPersistidas: number
  maestraCueCompletados: number
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

  // 1. Universo completo (en memoria) de escuelas candidatas, ludotecas del
  //    form, e instituciones de Maestra — nunca se persiste el pool
  //    completo de escuelas, solo se usa para el matching (ver paso 6, la
  //    sub-canónica que sí se persiste).
  const escuelaRows = await buildEntityRows("escuela", SOURCES)
  const ludotecaRows = await buildEntityRows("ludoteca", SOURCES)
  const institucionRows = await buildEntityRows("institucion", SOURCES)

  const escuelaRecords: ResolvableRecord[] = [...escuelaRows.entries()].map(([id, fields]) => ({
    id,
    fields,
  }))
  const ludotecaRecords: ResolvableRecord[] = [...ludotecaRows.entries()].map(([id, fields]) => ({
    id,
    fields,
  }))
  const institucionRecords: ResolvableRecord[] = [...institucionRows.entries()].map(
    ([id, fields]) => ({ id, fields })
  )

  // 2. Matching ludoteca->escuela e institucion->escuela, independientes
  //    entre sí, contra el mismo pool de escuelas candidatas.
  const ludotecaMatch = resolveEntities(ludotecaRecords, escuelaRecords, LUDOTECA_TO_ESCUELA)
  const matchByLudotecaId = new Map(
    [...ludotecaMatch.auto, ...ludotecaMatch.revision].map((m) => [m.sourceId, m])
  )

  const institucionMatch = resolveEntities(institucionRecords, escuelaRecords, INSTITUCION_TO_ESCUELA)
  const matchByInstitucionId = new Map(
    [...institucionMatch.auto, ...institucionMatch.revision].map((m) => [m.sourceId, m])
  )

  const spreadsheetId = masterSpreadsheetId()

  // 3. Completar el CUE de Maestra cuando el match es inequívoco (métodos
  //    TRUSTED — ver institucion.ts) y la celda original estaba vacía;
  //    nunca pisa un valor ya escrito a mano. Se hace temprano, antes de
  //    geocodificar (que puede tardar minutos), para minimizar la ventana
  //    entre leer Maestra y escribirle de vuelta.
  const cueUpdates = institucionRecords.flatMap((record) => {
    if (record.fields.cue_raw) return []
    const match = matchByInstitucionId.get(record.id)
    if (!isWritebackEligible(match)) return []
    return [{ rowIndex: record.fields.row_index, cue: match!.targetId }]
  })
  // Se reporta el candidato aunque sea --dry-run (así se puede previsualizar
  // antes de escribir de verdad en una spreadsheet externa); solo la
  // escritura en sí queda gateada por dryRun.
  if (!dryRun && cueUpdates.length > 0) {
    await writeResolvedCuesToMaestra(MAESTRA_2026.spreadsheet.spreadsheetId, MAESTRA_TAB, cueUpdates)
  }
  const maestraCueCompletados = cueUpdates.length

  // 4. Leer la tab Ludotecas actual, para no pisar filas que un humano ya
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

  // 5. Recalcular todas las filas de Ludotecas; las lockeadas se conservan
  //    tal cual (sin cambios respecto de antes de agregar Maestra).
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

  // 6. Sub-canónica: solo se persisten las escuelas efectivamente
  //    referenciadas por una ludoteca o una institución con estado
  //    auto/revision — no el padrón completo, que fue solo el pool de
  //    candidatos en memoria del paso 2.
  const referencedCues = new Set(
    [
      ...mergedLudotecas.filter((r) => tieneEscuela(r.estado)).map((r) => r.match_cue),
      ...[...matchByInstitucionId.values()]
        .filter((m) => tieneEscuela(m.estado))
        .map((m) => m.targetId),
    ].filter((cue): cue is string => Boolean(cue))
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

  // 7. Agrupar las filas de Maestra en instituciones únicas y unificarlas
  //    con las ludotecas del form — estos son los pines finales del mapa.
  //    La identidad de cada pin (`id`) no depende de a qué escuela resolvió
  //    un match fuzzy (ver institucion.ts), así que el lockeo humano
  //    sobrevive aunque el mejor candidato cambie entre corridas.
  const institucionGroups = buildInstitucionGroups(institucionRecords, matchByInstitucionId)
  const institucionPins = unifyWithLudotecas(institucionGroups, ludotecaRecords, matchByLudotecaId)

  const { rows: existingInstituciones, rowCount: prevInstitucionesCount } = await readTab(
    spreadsheetId,
    INSTITUCIONES_TAB,
    INSTITUCIONES_COLUMNS
  )
  const existingInstitucionById = new Map(existingInstituciones.map((r) => [r.id, r]))
  const lockedInstitucionIds = new Set(
    existingInstituciones.filter((r) => isLocked(r.estado)).map((r) => r.id)
  )

  const mergedInstituciones = institucionPins.map((pin) => {
    const prev = existingInstitucionById.get(pin.id)
    if (prev && lockedInstitucionIds.has(pin.id)) return prev

    const estado = pin.match?.estado ?? ""
    return {
      id: pin.id,
      nombre: pin.nombre,
      localidad: pin.localidad,
      departamento: pin.departamento,
      fuentes: pin.fuentes.join(";"),
      form_row_index: pin.formRowIndex,
      match_cue: pin.match?.targetId ?? "",
      match_metodo: pin.match?.metodo ?? "",
      match_score: pin.match ? pin.match.score.toFixed(2) : "",
      estado,
      // Coordenadas propias solo aplican cuando no hay escuela resuelta
      // (pin "sin_escuela" en el mapa, a nivel localidad) — mismo criterio
      // que ya usa Ludotecas.
      lat: !tieneEscuela(estado) && prev ? prev.lat : "",
      lng: !tieneEscuela(estado) && prev ? prev.lng : "",
      geocoded_at: !tieneEscuela(estado) && prev ? prev.geocoded_at : "",
      updated_at: now,
    }
  })

  let geocodadas = 0
  if (!dryRun) {
    // 8. Geocodificar (cacheado) escuelas persistidas sin coordenadas.
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

    // 9. Geocodificar (cacheado, a nivel localidad) instituciones sin
    //    escuela resuelta (incluye sin_match y fuzzy débil — se muestran
    //    como pin "sin_escuela" en el mapa). Departamento puede venir vacío
    //    si el pin es solo-Maestra; geocodeAddress ya tolera partes vacías.
    for (const institucion of mergedInstituciones) {
      if (tieneEscuela(institucion.estado) || institucion.lat) continue
      const address = [institucion.localidad, institucion.departamento, "Córdoba", "Argentina"]
        .filter(Boolean)
        .join(", ")
      const coords = await geocodeAddress(address)
      if (coords) {
        institucion.lat = String(coords.lat)
        institucion.lng = String(coords.lng)
        institucion.geocoded_at = now
        geocodadas++
      }
    }

    // 10. Escribir los tres tabs (overwrite atómico, una sola llamada cada
    //     uno). Ludotecas no cambia de esquema ni de lógica — sigue siendo
    //     la fuente cruda del form.
    await writeTab(spreadsheetId, LUDOTECAS_TAB, LUDOTECAS_COLUMNS, mergedLudotecas, prevLudotecaCount)
    await writeTab(spreadsheetId, ESCUELAS_TAB, ESCUELAS_COLUMNS, mergedEscuelas, existingEscuelas.length)
    await writeTab(
      spreadsheetId,
      INSTITUCIONES_TAB,
      INSTITUCIONES_COLUMNS,
      mergedInstituciones,
      prevInstitucionesCount
    )
  }

  return {
    ludotecas: ludotecaRecords.length,
    escuelasCandidatas: escuelaRecords.length,
    escuelasPersistidas: mergedEscuelas.length,
    auto: ludotecaMatch.auto.length,
    revision: ludotecaMatch.revision.length,
    sinMatch: ludotecaMatch.sinMatch.length,
    geocodadas,
    institucionesCandidatas: institucionRecords.length,
    institucionesPersistidas: mergedInstituciones.length,
    maestraCueCompletados,
  }
}

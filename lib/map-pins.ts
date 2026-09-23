// Arma los pines finales del mapa a partir de las tabs "Instituciones",
// "Escuelas" y "Ludotecas" ya leídas — comparten esta lógica el mapa admin
// (app/admin/map/[secret]) y el mapa público (app/relevamiento).
import type { Pin, SinCoordenadas } from "./map-types"

// Categorías públicas de un pin, derivadas de sus "fuentes" (Maestra) y de si
// respondió el formulario de relevamiento. Un pin puede caer en más de una a
// la vez (ej. está en Maestra por "50 Ludotecas" y también respondió el
// form). Usada solo para el mapa público -- el admin tiene su propia
// clasificación más granular (por color) en MapView.tsx.
export function pinKinds(pin: Pin): string[] {
  const kinds: string[] = []
  if (pin.fuentes.some((f) => f.startsWith("50 Ludotecas"))) kinds.push("50 Ludotecas")
  if (pin.fuentes.includes("C1 Ludotecas") || pin.fuentes.includes("C1 Programación"))
    kinds.push("Circular 1")
  if (pin.fuentes.includes("PIBE") || pin.fuentes.includes("PIE")) kinds.push("PIBE/PIE")
  if (Object.keys(pin.payload).length > 0) kinds.push("Relevamiento")
  if (kinds.length === 0) kinds.push("Otras")
  return kinds
}

// Desparrama pines que terminaron con las mismas coordenadas exactas (suele
// pasar cuando una institución sin escuela matcheada se geocodifica solo por
// localidad+departamento -- lib/consolidation/run.ts -- y varias instituciones
// del mismo pueblo caen en el mismo centroide) para que no queden apilados y
// se puedan clickear todos. El primero de cada grupo se deja en su lugar; el
// resto se desplaza con un offset normal (desvío ~500m, piso de 50m para que
// nunca quede pegado) determinístico por id de pin, así el mapa no "baila"
// entre cargas de página.
const JITTER_STD_METERS = 500
const JITTER_MIN_METERS = 50
const METERS_PER_DEGREE_LAT = 111320

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed
  return function () {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function jitterOverlappingPins(pins: Pin[]): Pin[] {
  const byCoord = new Map<string, Pin[]>()
  for (const pin of pins) {
    const key = `${pin.lat},${pin.lng}`
    const list = byCoord.get(key)
    if (list) list.push(pin)
    else byCoord.set(key, [pin])
  }

  for (const group of byCoord.values()) {
    if (group.length < 2) continue
    for (let i = 1; i < group.length; i++) {
      const pin = group[i]
      const rand = mulberry32(hashString(pin.id))
      const u1 = Math.max(rand(), 1e-9)
      const u2 = rand()
      const radiusMeters = Math.max(
        Math.sqrt(-2 * Math.log(u1)) * JITTER_STD_METERS,
        JITTER_MIN_METERS
      )
      const angle = 2 * Math.PI * u2
      pin.lat += (radiusMeters * Math.sin(angle)) / METERS_PER_DEGREE_LAT
      pin.lng +=
        (radiusMeters * Math.cos(angle)) /
        (METERS_PER_DEGREE_LAT * Math.cos((pin.lat * Math.PI) / 180))
    }
  }

  return pins
}

export function tieneEscuela(estado: string): boolean {
  return estado === "auto" || estado === "revision"
}

interface EscuelaMatchedEntry {
  id: string
  nombre: string
  localidad: string
  departamento: string
  escuela: Record<string, string>
  fuentes: string[]
  payload: Record<string, string>
}

interface BuildPinsArgs {
  instituciones: Record<string, string>[]
  escuelasByCue: Map<string, Record<string, string>>
  ludotecasByRowIndex: Map<string, Record<string, string>>
}

export function buildPins({
  instituciones,
  escuelasByCue,
  ludotecasByRowIndex,
}: BuildPinsArgs): { pins: Pin[]; sinCoordenadas: SinCoordenadas[] } {
  const pins: Pin[] = []
  const sinCoordenadas: SinCoordenadas[] = []
  const escuelaMatched: EscuelaMatchedEntry[] = []

  for (const inst of instituciones) {
    const ludoteca = inst.form_row_index
      ? ludotecasByRowIndex.get(inst.form_row_index)
      : undefined
    const payload = ludoteca?.raw_payload
      ? (JSON.parse(ludoteca.raw_payload) as Record<string, string>)
      : {}
    const fuentes = inst.fuentes ? inst.fuentes.split(";").filter(Boolean) : []

    const escuela = tieneEscuela(inst.estado) ? escuelasByCue.get(inst.match_cue) : undefined
    if (escuela && escuela.lat && escuela.lng) {
      escuelaMatched.push({
        id: inst.id,
        nombre: inst.nombre,
        localidad: inst.localidad,
        departamento: inst.departamento,
        escuela,
        fuentes,
        payload,
      })
      continue
    }

    if (inst.lat && inst.lng) {
      pins.push({
        id: inst.id,
        nombre: inst.nombre,
        localidad: inst.localidad,
        departamento: inst.departamento,
        lat: Number(inst.lat),
        lng: Number(inst.lng),
        escuela: null,
        fuentes,
        payload,
      })
      continue
    }

    sinCoordenadas.push({
      id: inst.id,
      nombre: inst.nombre,
      localidad: inst.localidad,
      departamento: inst.departamento,
    })
  }

  // Dos filas de Instituciones pueden resolver a la misma escuela sin
  // haberse unificado en el pipeline (lib/consolidation/institucion.ts solo
  // las fusiona cuando ambas resuelven por un método TRUSTED al mismo CUE —
  // ej. una llega por Maestra vía fuzzy y la otra por el form vía
  // cue_exact). Sin este paso quedan dos pines en las mismas coordenadas
  // (las de la escuela), tapándose entre sí en el mapa. Se fusionan acá, a
  // nivel de render, agrupando por CUE de escuela.
  const byCue = new Map<string, EscuelaMatchedEntry[]>()
  for (const entry of escuelaMatched) {
    const cue = entry.escuela.cue
    const list = byCue.get(cue)
    if (list) list.push(entry)
    else byCue.set(cue, [entry])
  }

  for (const entries of byCue.values()) {
    const withPayload = entries.find((e) => Object.keys(e.payload).length > 0)
    const base = withPayload ?? entries[0]
    pins.push({
      id: base.id,
      nombre: base.nombre,
      localidad: base.localidad,
      departamento: base.departamento,
      lat: Number(base.escuela.lat),
      lng: Number(base.escuela.lng),
      escuela: {
        nombre: base.escuela.nombre,
        cue: base.escuela.cue,
        domicilio: base.escuela.domicilio,
        localidad: base.escuela.localidad,
        departamento: base.escuela.departamento,
        orientacion: base.escuela.orientacion || null,
      },
      fuentes: [...new Set(entries.flatMap((e) => e.fuentes))],
      payload: base.payload,
    })
  }

  return { pins: jitterOverlappingPins(pins), sinCoordenadas }
}

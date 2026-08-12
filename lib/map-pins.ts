// Arma los pines finales del mapa a partir de las tabs "Instituciones",
// "Escuelas" y "Ludotecas" ya leídas — comparten esta lógica el mapa admin
// (app/admin/map/[secret]) y el mapa público (app/relevamiento).
import type { Pin, SinCoordenadas } from "./map-types"

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

  return { pins, sinCoordenadas }
}

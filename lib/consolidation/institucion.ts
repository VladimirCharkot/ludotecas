// Agrega las filas de la fuente Maestra (una por institución x programa) en
// instituciones únicas, y las unifica con los matches de ludoteca->escuela
// ya calculados por el pipeline existente, para construir los pines del tab
// "Instituciones" (lo que lee el mapa). Ver lib/consolidation/run.ts para el
// orden de estos pasos dentro de runConsolidation().
import { normalizeLocation, normalizeName } from "@/lib/matching/normalize"
import type { MatchResult, ResolvableRecord } from "@/lib/matching/resolve"

// Únicos métodos donde el CUE/código es inequívoco (apunta a exactamente una
// escuela, no a "una de varias que comparten cue_base sin anexo"). Solo
// estos habilitan que una mención de Maestra y una fila del form comparan
// identidad -- y por lo tanto, que el pin muestre el contacto personal del
// form. cue_base_exact es determinista entre corridas (mismo dato de
// entrada, mismo resultado) pero puede señalar al anexo equivocado, así que
// queda deliberadamente afuera. Nótese que ninguno de estos dos métodos
// puede dispararse en una fila con CUE vacío -- exact_key matchea contra el
// propio dato de entrada, así que una celda vacía nunca produce un match
// exacto. Por eso el writeback de CUE (ver isWritebackEligible más abajo)
// necesita su propio criterio, no puede reusar este set tal cual.
export const TRUSTED_METODOS = new Set(["cue_exact", "cod_empr_exact"])

// Elegibilidad para completar el CUE de una fila de Maestra que hoy está
// vacía (pedido #1 del usuario: "...a partir de nuestras fuentes existentes
// o consolidación de nombre"). Como una celda vacía nunca matchea por
// exact_key, la única vía real es el fuzzy_block por nombre+localidad --
// pero ahí el score no es solo "por encima del umbral de auto" (0.9): un
// score de 1.0 significa que, tras normalizar, el nombre de Maestra es
// IDÉNTICO al de la escuela dentro de su localidad, que es un estándar más
// alto que "suficientemente parecido para pinear en el mapa". Con un CUE ya
// presente en la fila (cue_exact/cod_empr_exact), da igual el CUE viejo no
// se toca -- esos métodos solo importan acá por completitud.
export function isWritebackEligible(match: MatchResult | undefined): boolean {
  if (!match) return false
  if (TRUSTED_METODOS.has(match.metodo)) return true
  return match.metodo === "fuzzy" && match.score === 1
}

export interface InstitucionGroup {
  rows: ResolvableRecord[]
  nombre: string
  localidad: string
  fuentes: string[]
  match?: MatchResult
}

export interface InstitucionPin {
  id: string
  nombre: string
  localidad: string
  departamento: string
  fuentes: string[]
  formRowIndex: string
  match?: MatchResult
}

function rawKey(nombre: string, localidad: string): string {
  return `${normalizeName(nombre)}|${normalizeLocation(localidad)}`
}

function bestMatch(a: MatchResult | undefined, b: MatchResult | undefined): MatchResult | undefined {
  if (!a) return b
  if (!b) return a
  return b.score > a.score ? b : a
}

// Identidad estable de un pin, independiente de a qué escuela resolvió el
// paso fuzzy (que puede cambiar de corrida a corrida si el pool de
// candidatos se actualiza). Solo un match TRUSTED comparte namespace "cue:"
// entre institución y ludoteca -- todo lo demás (fuzzy, cue_base_exact, sin
// match) queda en un namespace privado por fuente, para que nunca choque
// por casualidad con un match ambiguo de la otra fuente al mismo cue_base.
function stableId(
  source: "institucion" | "ludoteca",
  nombre: string,
  localidad: string,
  match: MatchResult | undefined
): string {
  if (match && TRUSTED_METODOS.has(match.metodo)) return `cue:${match.targetId}`
  return `${source}:loc:${rawKey(nombre, localidad)}`
}

// Paso 1: agrupa filas de Maestra por nombre+localidad normalizados (junta
// las casi-duplicadas por Fuente distinto), y después fusiona grupos
// distintos que resolvieron por el MISMO método confiable a la MISMA
// escuela (recupera gratis los duplicados con CUE, ej. filas PIBE/PIE
// repetidas). Duplicados sin CUE y con nombre mal tipeado quedan sin
// fusionar a propósito -- clustering automático por similitud de nombre
// arriesgaría juntar dos instituciones distintas, con solo ~200 filas no
// vale ese riesgo.
export function buildInstitucionGroups(
  institucionRecords: ResolvableRecord[],
  matchByInstitucionId: Map<string, MatchResult>
): InstitucionGroup[] {
  const byRawKey = new Map<string, InstitucionGroup>()

  for (const record of institucionRecords) {
    const nombre = record.fields.nombre
    const localidad = record.fields.localidad
    const fuente = record.fields.fuente
    const match = matchByInstitucionId.get(record.id)
    const key = rawKey(nombre, localidad)

    const existing = byRawKey.get(key)
    if (existing) {
      existing.rows.push(record)
      if (fuente && !existing.fuentes.includes(fuente)) existing.fuentes.push(fuente)
      existing.match = bestMatch(existing.match, match)
    } else {
      byRawKey.set(key, {
        rows: [record],
        nombre,
        localidad,
        fuentes: fuente ? [fuente] : [],
        match,
      })
    }
  }

  const byTrustedTarget = new Map<string, InstitucionGroup>()
  const groups: InstitucionGroup[] = []
  for (const group of byRawKey.values()) {
    const trusted = group.match && TRUSTED_METODOS.has(group.match.metodo)
    const canonical = trusted ? byTrustedTarget.get(group.match!.targetId) : undefined
    if (canonical) {
      canonical.rows.push(...group.rows)
      for (const fuente of group.fuentes) {
        if (!canonical.fuentes.includes(fuente)) canonical.fuentes.push(fuente)
      }
      continue
    }
    groups.push(group)
    if (trusted) byTrustedTarget.set(group.match!.targetId, group)
  }

  return groups
}

// Paso 2: junta los grupos de Maestra con las filas de ludoteca (form) en
// los pines finales. La unificación es un efecto lateral de que ambos lados
// usan la misma stableId(): cuando institución y ludoteca resuelven por un
// método TRUSTED a la MISMA escuela, terminan en el mismo id y se
// fusionan (fuentes + formRowIndex); en cualquier otro caso quedan como
// pines separados. Ninguna ludoteca desaparece por no tener contraparte en
// Maestra -- se recorren igual y se insertan si no fueron reclamadas ya.
export function unifyWithLudotecas(
  groups: InstitucionGroup[],
  ludotecaRecords: ResolvableRecord[],
  matchByLudotecaId: Map<string, MatchResult>
): InstitucionPin[] {
  const pins = new Map<string, InstitucionPin>()

  function upsert(
    id: string,
    patch: {
      nombre: string
      localidad: string
      departamento?: string
      fuentes?: string[]
      formRowIndex?: string
      match?: MatchResult
    }
  ) {
    const existing = pins.get(id)
    if (!existing) {
      pins.set(id, {
        id,
        nombre: patch.nombre,
        localidad: patch.localidad,
        departamento: patch.departamento ?? "",
        fuentes: patch.fuentes ?? [],
        formRowIndex: patch.formRowIndex ?? "",
        match: patch.match,
      })
      return
    }
    // El form (si está presente) manda en el nombre/localidad/departamento
    // de display -- mismo criterio que usa hoy el mapa (el pin muestra el
    // nombre tal cual lo escribió quien llenó el form, no el de Maestra).
    existing.nombre = patch.nombre || existing.nombre
    existing.localidad = patch.localidad || existing.localidad
    existing.departamento = patch.departamento || existing.departamento
    existing.fuentes = [...new Set([...existing.fuentes, ...(patch.fuentes ?? [])])]
    existing.formRowIndex = patch.formRowIndex || existing.formRowIndex
    existing.match = bestMatch(existing.match, patch.match)
  }

  for (const group of groups) {
    upsert(stableId("institucion", group.nombre, group.localidad, group.match), {
      nombre: group.nombre,
      localidad: group.localidad,
      fuentes: group.fuentes,
      match: group.match,
    })
  }

  for (const record of ludotecaRecords) {
    const nombre = record.fields.nombre
    const localidad = record.fields.localidad
    const match = matchByLudotecaId.get(record.id)
    upsert(stableId("ludoteca", nombre, localidad, match), {
      nombre,
      localidad,
      departamento: record.fields.departamento,
      formRowIndex: record.fields.row_index,
      match,
    })
  }

  return [...pins.values()]
}

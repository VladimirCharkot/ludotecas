// Fuentes y reglas de resolución para el motor de consolidación. Agregar una
// fuente o una entidad nueva (ej. Persona -> Escuela por DNI) es editar este
// archivo, no tocar el motor (lib/matching/resolve.ts) ni el merge
// (lib/consolidation/merge.ts).
//
// Los IDs de spreadsheet de las fuentes estáticas son de Drive, no
// secretos — van como literales acá, no en env. Completar con los IDs
// reales una vez subidas a Drive (ver plan: padrón nacional y DGESec deben
// vivir como Google Sheets compartidos con la cuenta de servicio).
import { normalizeCodEmpr, normalizeCue } from "@/lib/matching/normalize"
import { firstNonEmpty } from "@/lib/consolidation/read-source"
import type {
  CanonicalSourceConfig,
  EnrichSourceConfig,
  EntityResolutionConfig,
  SourceConfig,
} from "@/lib/consolidation/types"

const PADRON_NACIONAL_SPREADSHEET_ID =
  "1ardL9b2ipkRZrJyY3LkiQC7Pt3D_2vrtUJMG2UYwsZw"
const DGESEC_SPREADSHEET_ID = "1o4HwwSs4tkNqeLhx9wG7Sy5wCdJNDFhnmBOnbg60K6g"
const MAESTRA_2026_ID = "1Vm2x-4jVA5hjcB4iGccYsH3yp434JN6f7ztFhafFcYg"

// CUE completo sin puntuación -> CUE sin los 2 dígitos de anexo, o "" si es
// muy corto para tener anexo. Usado tanto acá (padrón) como en MAESTRA_2026
// para poder exact_key-matchear por "cue_base" sin pasar por `derive` en el
// motor (Maestra a veces ya trae el CUE sin anexo, no uno completo para
// truncar — ver comentario en MAESTRA_2026 más abajo).
function cueBase(cue: string): string {
  return cue.length >= 8 ? cue.slice(0, -2) : ""
}

export const PADRON_NACIONAL_2026: CanonicalSourceConfig = {
  id: "padron_nacional_2026",
  entity: "escuela",
  role: "canonical",
  spreadsheet: {
    spreadsheetId: PADRON_NACIONAL_SPREADSHEET_ID,
    // El padrón nacional tiene ~65k filas (todas las jurisdicciones); Córdoba
    // arranca bien pasada la fila 20000 (por eso el margen generoso).
    range: "padron!A1:AZ100000",
  },
  sourceRowKey: "cue",
  fields: {
    cue: "Cueanexo",
    nombre: "Nombre",
    localidad: "Localidad",
    departamento: "Departamento",
    domicilio: "Domicilio",
  },
  filter: { column: "Jurisdicción", equals: "Córdoba" },
  transform: (mapped) => ({ ...mapped, cue_base: cueBase(mapped.cue) }),
}

export const DGESEC_2016: EnrichSourceConfig = {
  id: "dgesec_2016",
  entity: "escuela",
  role: "enrich",
  spreadsheet: {
    spreadsheetId: DGESEC_SPREADSHEET_ID,
    range: "'Centros educativos de la DGESec'!A1:AZ5000",
  },
  sourceRowKey: "cod_empr",
  fields: {
    cod_empr: "COD. EMPR.",
    nombre: "ESCUELA",
    localidad: "LOCALIDAD",
    departamento: "DPTO.",
    orientacion: "ORIENTACION",
  },
  // Sin CUE compatible con el padrón nacional — se une por nombre+ubicación.
  joinFields: ["nombre", "localidad", "departamento"],
  // cod_empr se retiene (no solo se usa para el join) porque MAESTRA_2026
  // trae ese mismo formato de código en su columna CUE para algunas filas
  // (PIBE/PIE) y necesita poder matchearlo exact_key contra la escuela.
  enrichFields: ["orientacion", "cod_empr"],
  transform: (row) => ({
    ...row,
    orientacion: row.orientacion.trim() === "NO POSEE" ? "" : row.orientacion,
    cod_empr: normalizeCodEmpr(row.cod_empr),
  }),
}

// Nombre del tab dentro de MAESTRA_2026 -- se reusa tanto para leer (acá)
// como para el writeback de CUE (lib/consolidation/maestra-writeback.ts).
export const MAESTRA_TAB = "Maestra"

export const MAESTRA_2026: CanonicalSourceConfig = {
  id: "maestra_2026",
  entity: "institucion",
  role: "canonical",
  spreadsheet: {
    spreadsheetId: MAESTRA_2026_ID,
    range: `${MAESTRA_TAB}!A1:F2000`,
  },
  sourceRowKey: "row_index",
  fields: {
    nombre: "Institución",
    localidad: "Localidad",
    contacto: "Contacto",
    cue_raw: "CUE",
    notas: "Notas",
    fuente: "Fuente",
  },
  // Filas sin nombre se descartan. La columna CUE de Maestra mezcla dos
  // formatos según la fuente que la llenó: CUE numérico estilo padrón
  // (completo o, a veces, ya sin los 2 dígitos de anexo) y código estilo
  // DGESec ("EE0410413"). Los separamos en 3 campos alineados con los que
  // terminan teniendo los registros de escuela (cue, cue_base, cod_empr) —
  // así el matching contra escuela es puro exact_key declarativo, sin
  // heurística de formato en el motor. cue_raw (el valor tal cual, trimeado)
  // se conserva para decidir después si la celda original estaba vacía.
  transform: (mapped, _raw, rowIndex) => {
    if (!mapped.nombre) return null
    const trimmed = mapped.cue_raw.trim()

    let cue = ""
    let cue_base = ""
    let cod_empr = ""
    if (/^EE\d+$/i.test(trimmed)) {
      cod_empr = normalizeCodEmpr(trimmed)
    } else {
      const digits = normalizeCue(trimmed)
      if (digits.length === 9) {
        cue = digits
        cue_base = cueBase(digits)
      } else if (digits.length === 7) {
        // Ya viene sin anexo (ej. "1404040") — no es un CUE completo que
        // truncar, es directamente la forma "base".
        cue_base = digits
      }
      // Cualquier otra longitud es dato sucio: no se usa para matchear.
    }

    return {
      ...mapped,
      cue_raw: trimmed,
      cue,
      cue_base,
      cod_empr,
      row_index: String(rowIndex + 2),
    }
  },
}

export const LUDOTECAS_FORM: CanonicalSourceConfig = {
  id: "ludotecas_form",
  entity: "ludoteca",
  role: "canonical",
  spreadsheet: {
    spreadsheetId: process.env.GOOGLE_SHEET_LUDOTECAS_ID ?? "<COMPLETAR>",
    range: process.env.GOOGLE_SHEET_LUDOTECAS_RANGE ?? "A1:AZ5000",
  },
  sourceRowKey: "row_index",
  fields: {
    nombre: "Nombre de la institución",
    localidad: "Localidad",
    departamento: "Departamento",
    cue: "Nro de CUE",
  },
  // Filas sin nombre se descartan (igual que hoy). row_index es la fila real
  // en la planilla (1 = encabezado); raw_payload conserva el resto del form
  // (todas las columnas, sin normalizar) para el panel de detalle del mapa.
  transform: (mapped, raw, rowIndex) => {
    if (!mapped.nombre) return null
    const rawPayload = Object.fromEntries(
      Object.entries(raw).map(([key, values]) => [
        key,
        firstNonEmpty(...values),
      ])
    )
    return {
      ...mapped,
      row_index: String(rowIndex + 2),
      raw_payload: JSON.stringify(rawPayload),
    }
  },
}

export const SOURCES: SourceConfig[] = [
  PADRON_NACIONAL_2026,
  DGESEC_2016,
  LUDOTECAS_FORM,
  MAESTRA_2026,
]

export const LUDOTECA_TO_ESCUELA: EntityResolutionConfig = {
  id: "ludoteca_to_escuela",
  from: "ludoteca",
  to: "escuela",
  autoThreshold: 0.9,
  revisionThreshold: 0.7,
  steps: [
    {
      type: "exact_key",
      field: "cue",
      kind: "cue",
      score: 1,
      metodo: "cue_exact",
    },
    // Un CUE base (sin los 2 dígitos de anexo) idéntico es fuerte pero no
    // tan fuerte como el CUE completo.
    {
      type: "exact_key",
      field: "cue",
      kind: "cue",
      derive: "cue_base",
      score: 0.95,
      metodo: "cue_exact_sin_anexo",
    },
    {
      type: "fuzzy_block",
      blockFields: ["departamento", "localidad"],
      fuzzyField: "nombre",
      metodo: "fuzzy",
    },
  ],
}

export const INSTITUCION_TO_ESCUELA: EntityResolutionConfig = {
  id: "institucion_to_escuela",
  from: "institucion",
  to: "escuela",
  autoThreshold: 0.9,
  revisionThreshold: 0.7,
  steps: [
    { type: "exact_key", field: "cue", kind: "cue", score: 1, metodo: "cue_exact" },
    // cue_base viene pre-truncado de ambos lados (ver `cueBase` más arriba y
    // el transform de MAESTRA_2026) — sin `derive`, a diferencia del step
    // análogo de LUDOTECA_TO_ESCUELA, porque Maestra a veces entrega el CUE
    // ya sin anexo (no un CUE completo para truncar en el motor).
    { type: "exact_key", field: "cue_base", kind: "raw", score: 0.95, metodo: "cue_base_exact" },
    { type: "exact_key", field: "cod_empr", kind: "raw", score: 0.95, metodo: "cod_empr_exact" },
    // Sin "departamento" en Maestra — bloqueamos solo por localidad (más
    // candidatos por bloque que LUDOTECA_TO_ESCUELA, pero es lo que hay).
    {
      type: "fuzzy_block",
      blockFields: ["localidad"],
      fuzzyField: "nombre",
      metodo: "fuzzy",
    },
  ],
}

// Fuentes y reglas de resolución para el motor de consolidación. Agregar una
// fuente o una entidad nueva (ej. Persona -> Escuela por DNI) es editar este
// archivo, no tocar el motor (lib/matching/resolve.ts) ni el merge
// (lib/consolidation/merge.ts).
//
// Los IDs de spreadsheet de las fuentes estáticas son de Drive, no
// secretos — van como literales acá, no en env. Completar con los IDs
// reales una vez subidas a Drive (ver plan: padrón nacional y DGESec deben
// vivir como Google Sheets compartidos con la cuenta de servicio).
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
  enrichFields: ["orientacion"],
  transform: (row) => ({
    ...row,
    orientacion: row.orientacion.trim() === "NO POSEE" ? "" : row.orientacion,
  }),
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

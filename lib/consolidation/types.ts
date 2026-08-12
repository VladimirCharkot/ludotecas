// Config declarativo para el motor de consolidación: qué fuentes existen,
// a qué entidad pertenecen, y cómo se resuelven las relaciones entre
// entidades (ej. ludoteca -> escuela). Ver config/consolidation.ts para las
// instancias concretas.

export type EntityType = "escuela" | "ludoteca" | "institucion"
export type FieldKind = "name" | "location" | "cue" | "raw"

export interface DriveRange {
  spreadsheetId: string
  range: string
}

export type FieldMapping = Record<string, string>

export interface SimpleFilter {
  column: string
  equals: string
}

interface BaseSourceConfig {
  id: string
  entity: EntityType
  spreadsheet: DriveRange
  // Campo canónico que identifica una fila de forma única dentro de esta
  // fuente. Cualquier fila cuyo valor mapeado quede vacío se descarta.
  sourceRowKey: string
  fields: FieldMapping
  filter?: SimpleFilter
  // Escapatoria para lo genuinamente ad-hoc de una fuente (sentinels,
  // combinar columnas, o devolver null para descartar la fila).
  transform?: (
    mapped: Record<string, string>,
    raw: Record<string, string[]>,
    rowIndex: number
  ) => Record<string, string> | null
}

export interface CanonicalSourceConfig extends BaseSourceConfig {
  // Define el universo de filas de la entidad (ej. el padrón para escuela).
  role: "canonical"
}

export interface EnrichSourceConfig extends BaseSourceConfig {
  // Solo agrega campos a filas que ya puso una fuente canonical, unido por
  // joinFields (no por sourceRowKey, que puede ser incompatible entre fuentes).
  role: "enrich"
  joinFields: string[]
  enrichFields: string[]
}

export type SourceConfig = CanonicalSourceConfig | EnrichSourceConfig

export function isCanonicalSource(source: SourceConfig): source is CanonicalSourceConfig {
  return source.role === "canonical"
}

export function isEnrichSource(source: SourceConfig): source is EnrichSourceConfig {
  return source.role === "enrich"
}

export type Derivation = "cue_base"

export interface ExactKeyStep {
  type: "exact_key"
  field: string
  kind: FieldKind
  derive?: Derivation
  score: number
  metodo: string
}

export interface FuzzyBlockStep {
  type: "fuzzy_block"
  blockFields: string[]
  fuzzyField: string
  metodo: string
}

export type ResolutionStep = ExactKeyStep | FuzzyBlockStep

export interface EntityResolutionConfig {
  id: string
  from: EntityType
  to: EntityType
  autoThreshold: number
  revisionThreshold: number
  // Se intentan en orden; los exact_key van antes que el fuzzy_block (a lo
  // sumo uno, al final). Un exact_key que matchea nunca cae al fuzzy, aunque
  // su score quede por debajo de revisionThreshold (ver lib/matching/resolve.ts).
  steps: ResolutionStep[]
}

// Cómo normalizar cada campo canónico, por entidad — usado por el merge
// multi-fuente (joinFields) y por el motor de resolución (exact_key/fuzzy).
export const FIELD_KINDS: Record<EntityType, Record<string, FieldKind>> = {
  escuela: {
    nombre: "name",
    localidad: "location",
    departamento: "location",
    cue: "cue",
    domicilio: "raw",
    orientacion: "raw",
  },
  ludoteca: {
    nombre: "name",
    localidad: "location",
    departamento: "location",
    cue: "cue",
  },
  // Sin fuentes "enrich" propias hoy — la entrada existe solo porque
  // Record<EntityType, ...> exige las 3 keys.
  institucion: {
    nombre: "name",
    localidad: "location",
    cue: "cue",
  },
}

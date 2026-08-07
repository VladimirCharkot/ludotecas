// Junta las fuentes de una misma entidad en un solo universo de filas: las
// `canonical` definen el conjunto de filas (indexado por sourceRowKey); las
// `enrich` solo agregan campos a filas que ya existen, unidas por
// joinFields normalizados según el tipo de cada campo (FIELD_KINDS). Esto
// generaliza lo que hacía scripts/seed-escuelas.ts para cruzar el padrón
// (canonical) con DGESec (enrich, por nombre+ubicación en vez de CUE).
import { normalizeCue, normalizeLocation, normalizeName } from "@/lib/matching/normalize"
import { readSource } from "./read-source"
import {
  FIELD_KINDS,
  isCanonicalSource,
  isEnrichSource,
  type EntityType,
  type FieldKind,
  type SourceConfig,
} from "./types"

const NORMALIZE_BY_KIND: Record<FieldKind, (value: string) => string> = {
  cue: normalizeCue,
  name: normalizeName,
  location: normalizeLocation,
  raw: (value) => value,
}

function joinKeyOf(entity: EntityType, row: Record<string, string>, fields: string[]): string {
  return fields
    .map((field) => NORMALIZE_BY_KIND[FIELD_KINDS[entity][field]](row[field] ?? ""))
    .join("|")
}

export async function buildEntityRows(
  entity: EntityType,
  sources: SourceConfig[]
): Promise<Map<string, Record<string, string>>> {
  const rows = new Map<string, Record<string, string>>()
  const entitySources = sources.filter((source) => source.entity === entity)

  for (const source of entitySources.filter(isCanonicalSource)) {
    for (const row of await readSource(source)) {
      rows.set(row[source.sourceRowKey], row)
    }
  }

  for (const source of entitySources.filter(isEnrichSource)) {
    const byJoinKey = new Map(
      [...rows.values()].map((row) => [joinKeyOf(entity, row, source.joinFields), row])
    )
    for (const row of await readSource(source)) {
      const target = byJoinKey.get(joinKeyOf(entity, row, source.joinFields))
      if (!target) continue
      for (const field of source.enrichFields) {
        if (row[field]) target[field] = row[field]
      }
    }
  }

  return rows
}

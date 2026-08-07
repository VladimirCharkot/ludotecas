// Motor de resolución genérico: dado un config declarativo (ver
// lib/consolidation/types.ts), matchea records de una entidad contra otra
// por key exacta (con variantes) y, si no hay hit, por bloque+fuzzy. Mismo
// approach que el match.ts original (CUE exacto -> CUE sin anexo -> bloque
// por ubicación + fuzzy por nombre), generalizado a campos configurables en
// vez de hardcodeados, para poder reusarlo con otras entidades (ej. Persona
// -> Escuela por DNI) sin tocar este archivo.
import { search } from "fast-fuzzy"
import { normalizeCue, normalizeLocation, normalizeName } from "./normalize"
import type {
  EntityResolutionConfig,
  ExactKeyStep,
  FieldKind,
  FuzzyBlockStep,
} from "@/lib/consolidation/types"

export interface ResolvableRecord {
  id: string
  fields: Record<string, string>
}

export type Estado = "auto" | "revision"

export interface MatchResult {
  sourceId: string
  targetId: string
  metodo: string
  score: number
  estado: Estado
}

export interface SinMatch {
  sourceId: string
  razon: "sin_bloque" | "score_bajo"
  mejorScore?: number
}

export interface MatchRunResult {
  auto: MatchResult[]
  revision: MatchResult[]
  sinMatch: SinMatch[]
}

const NORMALIZERS: Record<FieldKind, (value: string) => string> = {
  cue: normalizeCue,
  name: normalizeName,
  location: normalizeLocation,
  raw: (value) => value,
}

const DERIVERS: Record<string, (value: string) => string | null> = {
  cue_base: (value) => (value.length >= 8 ? value.slice(0, -2) : null),
}

function classify(score: number, config: EntityResolutionConfig): Estado | null {
  if (score >= config.autoThreshold) return "auto"
  if (score >= config.revisionThreshold) return "revision"
  return null
}

function keyFor(step: ExactKeyStep, fields: Record<string, string>): string | null {
  const normalized = NORMALIZERS[step.kind](fields[step.field] ?? "")
  return step.derive ? DERIVERS[step.derive](normalized) : normalized
}

function buildExactIndex(targets: ResolvableRecord[], step: ExactKeyStep) {
  const index = new Map<string, ResolvableRecord>()
  for (const target of targets) {
    const key = keyFor(step, target.fields)
    if (key) index.set(key, target)
  }
  return index
}

function buildBlockIndex(targets: ResolvableRecord[], step: FuzzyBlockStep) {
  const index = new Map<string, ResolvableRecord[]>()
  for (const target of targets) {
    const key = step.blockFields
      .map((field) => normalizeLocation(target.fields[field] ?? ""))
      .join("|")
    const bucket = index.get(key)
    if (bucket) bucket.push(target)
    else index.set(key, [target])
  }
  return index
}

export function resolveEntities(
  sources: ResolvableRecord[],
  targets: ResolvableRecord[],
  config: EntityResolutionConfig
): MatchRunResult {
  const exactSteps = config.steps.filter(
    (step): step is ExactKeyStep => step.type === "exact_key"
  )
  const fuzzyStep = config.steps.find(
    (step): step is FuzzyBlockStep => step.type === "fuzzy_block"
  )

  const exactIndexes = exactSteps.map((step) => ({ step, index: buildExactIndex(targets, step) }))
  const blockIndex = fuzzyStep ? buildBlockIndex(targets, fuzzyStep) : null

  const auto: MatchResult[] = []
  const revision: MatchResult[] = []
  const sinMatch: SinMatch[] = []

  for (const source of sources) {
    let resolved = false

    for (const { step, index } of exactIndexes) {
      const key = keyFor(step, source.fields)
      const hit = key ? index.get(key) : undefined
      if (!hit) continue

      // Una key exacta configurada es mejor evidencia que un guess por
      // nombre: si matchea pero su score no llega a revisionThreshold, es
      // sin_match — nunca cae al paso fuzzy siguiente.
      const estado = classify(step.score, config)
      if (estado) {
        ;(estado === "auto" ? auto : revision).push({
          sourceId: source.id,
          targetId: hit.id,
          metodo: step.metodo,
          score: step.score,
          estado,
        })
      } else {
        sinMatch.push({ sourceId: source.id, razon: "score_bajo", mejorScore: step.score })
      }
      resolved = true
      break
    }
    if (resolved) continue

    if (!fuzzyStep || !blockIndex) {
      sinMatch.push({ sourceId: source.id, razon: "sin_bloque" })
      continue
    }

    const blockKey = fuzzyStep.blockFields
      .map((field) => normalizeLocation(source.fields[field] ?? ""))
      .join("|")
    const candidates = blockIndex.get(blockKey)
    if (!candidates || candidates.length === 0) {
      sinMatch.push({ sourceId: source.id, razon: "sin_bloque" })
      continue
    }

    const term = normalizeName(source.fields[fuzzyStep.fuzzyField] ?? "")
    const results = search(term, candidates, {
      keySelector: (candidate) => normalizeName(candidate.fields[fuzzyStep.fuzzyField] ?? ""),
      returnMatchData: true,
    })
    const best = results[0]
    const score = best?.score ?? 0
    const estado = classify(score, config)

    if (best && estado) {
      ;(estado === "auto" ? auto : revision).push({
        sourceId: source.id,
        targetId: best.item.id,
        metodo: fuzzyStep.metodo,
        score,
        estado,
      })
    } else {
      sinMatch.push({ sourceId: source.id, razon: "score_bajo", mejorScore: score })
    }
  }

  return { auto, revision, sinMatch }
}

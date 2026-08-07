import { describe, expect, test } from "bun:test"
import { fuzzy } from "fast-fuzzy"
import { normalizeCue, normalizeName } from "./normalize"

// Pares reales tomados de data/ (mismo CUE en la planilla de Ludotecas y en
// el padrón nacional 2026), con las variantes de tipeo que aparecen en la
// práctica: mayúsculas, tildes, puntuación, "N°"/"Nº", prefijos institucionales.
const REAL_NAME_PAIRS: [string, string][] = [
  ["I.P.E.M. N 201 Leopoldo Marechal.", "I.P.E.M. Nº 201 LEOPOLDO MARECHAL"],
  ["MIGUEL CANE", "COLEGIO MIGUEL CANE"],
  ["ALFONSINA STORNI", "ESCUELA ALFONSINA STORNI"],
  [
    "CORONEL AGUSTIN ANGEL OLMEDO",
    "ESCUELA CORONEL AGUSTIN ANGEL OLMEDO",
  ],
  [
    'IPEM 385 "Valle de Los Reartes"',
    "I.P.E.M. N°385 VALLE DE LOS REARTES",
  ],
  ["IPET N° 409", "I.P.E.T. Nº 409"],
  ["JUAN BAUTISTA ALBERDI", "ESCUELA JUAN BAUTISTA ALBERDI"],
  ["IPEM 178 AMERICA LATINA", "I.P.E.M. Nº 178  AMERICA LATINA"],
  [
    "IPEM 304 JUAN CARLOS FERRERO",
    "I.P.E.M. Nº 304 JUAN CARLOS FERRERO",
  ],
  ["Víctor Mercante", "ESCUELA VICTOR MERCANTE"],
]

describe("normalizeName", () => {
  test.each(REAL_NAME_PAIRS)(
    "'%s' y '%s' normalizan a la misma forma o muy cerca",
    (a, b) => {
      const normA = normalizeName(a)
      const normB = normalizeName(b)
      const similarity = normA === normB ? 1 : fuzzy(normA, normB)
      expect(similarity).toBeGreaterThanOrEqual(0.9)
    }
  )
})

describe("normalizeCue", () => {
  test("extrae solo dígitos", () => {
    expect(normalizeCue("14.024.570-0")).toBe("140245700")
    expect(normalizeCue(140245700)).toBe("140245700")
    expect(normalizeCue(null)).toBe("")
    expect(normalizeCue(undefined)).toBe("")
  })
})

import diacritics from "diacritics"

const INSTITUTIONAL_STOPWORDS = new Set([
  "escuela",
  "esc",
  "ep",
  "egb",
  "colegio",
  "n",
  "no",
  "nro",
  "instituto",
])

function stripAccentsAndPunctuation(value: string): string {
  return diacritics
    .remove(value.toLowerCase())
    // Puntuación que aparece dentro de siglas/abreviaturas ("I.P.E.M.", "Nº",
    // "N°") se borra sin dejar espacio, para que "I.P.E.M." colapse a "ipem"
    // en vez de partirse en letras sueltas.
    .replace(/[.°º'´]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function normalizeName(value: string): string {
  const cleaned = stripAccentsAndPunctuation(value ?? "")
  return cleaned
    .split(" ")
    .filter((token) => token.length > 0 && !INSTITUTIONAL_STOPWORDS.has(token))
    .join(" ")
}

export function normalizeLocation(value: string): string {
  return stripAccentsAndPunctuation(value ?? "")
}

export function normalizeCue(value: string | number | null | undefined): string {
  return String(value ?? "").replace(/\D/g, "")
}

// Códigos estilo DGESec ("EE0410413"): a diferencia del CUE, no son solo
// dígitos — normalizamos may/min y espacios para que ambos lados de un
// exact_key (DGESec y Maestra) comparen igual sin depender de que cada
// fuente lo haya tipeado con el mismo casing.
export function normalizeCodEmpr(value: string | null | undefined): string {
  return String(value ?? "").trim().toUpperCase()
}

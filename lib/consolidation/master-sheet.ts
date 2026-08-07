// Mecánica de lectura/escritura de las tabs de la planilla maestra. Solo lo
// usa el script/ruta de consolidación (necesita el cliente de escritura) —
// la página del mapa lee la planilla con fetchSheetRange (solo lectura).
// Sin "server-only": lo usan tanto rutas de Next como scripts/consolidate.ts
// standalone (ver nota en lib/google-auth.ts).
import { google } from "googleapis"
import { getSheetsWriteAuthClient } from "@/lib/google-auth"

export const ESCUELAS_TAB = "Escuelas"
export const LUDOTECAS_TAB = "Ludotecas"

export const ESCUELAS_COLUMNS = [
  "cue",
  "nombre",
  "localidad",
  "departamento",
  "domicilio",
  "orientacion",
  "lat",
  "lng",
  "geocoded_at",
  "updated_at",
] as const

export const LUDOTECAS_COLUMNS = [
  "row_index",
  "nombre",
  "localidad",
  "departamento",
  "cue",
  "raw_payload",
  "match_cue",
  "match_metodo",
  "match_score",
  "estado",
  "lat",
  "lng",
  "geocoded_at",
  "updated_at",
] as const

const LOCKED_ESTADOS = new Set(["auto", "rechazado"])

export function isLocked(estado: string): boolean {
  return LOCKED_ESTADOS.has(estado)
}

export function columnLetter(count: number): string {
  let n = count
  let letters = ""
  while (n > 0) {
    const rem = (n - 1) % 26
    letters = String.fromCharCode(65 + rem) + letters
    n = Math.floor((n - 1) / 26)
  }
  return letters
}

async function sheetsClient() {
  return google.sheets({ version: "v4", auth: getSheetsWriteAuthClient() })
}

async function ensureTab(
  spreadsheetId: string,
  tab: string,
  columns: readonly string[]
): Promise<void> {
  const sheets = await sheetsClient()
  const { data } = await sheets.spreadsheets.get({ spreadsheetId })
  const exists = data.sheets?.some((s) => s.properties?.title === tab)
  if (exists) return

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: tab } } }] },
  })
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tab}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [[...columns]] },
  })
}

export async function readTab(
  spreadsheetId: string,
  tab: string,
  columns: readonly string[]
): Promise<{ rows: Record<string, string>[]; rowCount: number }> {
  await ensureTab(spreadsheetId, tab, columns)
  const sheets = await sheetsClient()
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tab}!A2:${columnLetter(columns.length)}`,
  })
  const values = data.values ?? []
  const rows = values.map((row) => Object.fromEntries(columns.map((c, i) => [c, row[i] ?? ""])))
  return { rows, rowCount: rows.length }
}

// Una sola llamada que sobreescribe todo el rango de datos (fila 2 en
// adelante), rellenado con filas vacías hasta cubrir al menos la cantidad de
// filas que tenía la tab antes de esta corrida. Evita el hueco de dos
// llamadas separadas (clear + update) donde un fallo a mitad de camino deja
// la tab vacía.
export async function writeTab(
  spreadsheetId: string,
  tab: string,
  columns: readonly string[],
  rows: Record<string, string>[],
  previousRowCount: number
): Promise<void> {
  const sheets = await sheetsClient()
  const totalRows = Math.max(rows.length, previousRowCount)
  const values = Array.from({ length: totalRows }, (_, i) => {
    const row = rows[i]
    return row ? columns.map((c) => row[c] ?? "") : columns.map(() => "")
  })
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tab}!A2`,
    valueInputOption: "RAW",
    requestBody: { values },
  })
}

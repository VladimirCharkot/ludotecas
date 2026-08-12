// Escribe de vuelta el CUE resuelto en la propia spreadsheet Maestra (fuente
// externa, no la planilla maestra derivada) -- solo en celdas que estaban
// vacías, nunca pisa un valor ya escrito a mano. El filtro de qué filas
// califican (match inequívoco) vive en run.ts; este módulo solo sabe
// escribir. Sin "server-only": mismo motivo que el resto de
// lib/consolidation (lo usa scripts/consolidate.ts standalone).
import { google } from "googleapis"
import { getSheetsWriteAuthClient } from "@/lib/google-auth"
import { fetchSheetRange } from "@/lib/sheets"
import { columnLetter } from "./master-sheet"

export interface CueWriteback {
  rowIndex: string
  cue: string
}

// Busca la columna "CUE" por header en vez de asumir una posición fija --
// Maestra puede reordenar columnas sin que esto se rompa en silencio.
async function cueColumnLetter(spreadsheetId: string, tab: string): Promise<string> {
  const [header] = await fetchSheetRange(spreadsheetId, `${tab}!A1:Z1`)
  const idx = header?.indexOf("CUE") ?? -1
  if (idx < 0) throw new Error(`No se encontró la columna "CUE" en ${tab}`)
  return columnLetter(idx + 1)
}

export async function writeResolvedCuesToMaestra(
  spreadsheetId: string,
  tab: string,
  updates: CueWriteback[]
): Promise<void> {
  if (updates.length === 0) return

  const col = await cueColumnLetter(spreadsheetId, tab)
  const sheets = google.sheets({ version: "v4", auth: getSheetsWriteAuthClient() })
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data: updates.map((u) => ({ range: `${tab}!${col}${u.rowIndex}`, values: [[u.cue]] })),
    },
  })
}

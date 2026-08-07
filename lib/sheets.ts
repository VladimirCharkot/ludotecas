// lib/sheets.ts
// Sin "server-only": lo usan tanto rutas de Next como scripts/consolidate.ts
// standalone (ver nota en lib/google-auth.ts).
import { google } from "googleapis"
import { getSheetsAuthClient } from "@/lib/google-auth"

export async function fetchSheetRange(
  spreadsheetId: string,
  range: string
): Promise<string[][]> {
  const client = google.sheets({ version: "v4", auth: getSheetsAuthClient() })
  const res = await client.spreadsheets.values.get({ spreadsheetId, range })
  return (res.data.values ?? []) as string[][]
}

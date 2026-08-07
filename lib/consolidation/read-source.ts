// Lector genérico de una fuente Drive Sheet: agrupa columnas por encabezado,
// aplica el filtro simple declarativo y el mapeo de campos de un
// SourceConfig, y descarta filas sin sourceRowKey. El único punto de
// extensión no declarativo es `transform` (ver types.ts).
// Sin "server-only": lo usan tanto rutas de Next como scripts/consolidate.ts
// standalone (ver nota en lib/google-auth.ts).
import { fetchSheetRange } from "@/lib/sheets"
import type { SourceConfig } from "./types"

export function firstNonEmpty(...values: string[]): string {
  for (const value of values) {
    const trimmed = value.trim()
    if (trimmed) return trimmed
  }
  return ""
}

// El form (y alguna fuente estática) repite encabezados (dos columnas
// "Departamento"): agrupamos por nombre de columna en vez de colapsar a un
// solo valor por fila, para no perder ninguna.
function rowsToObjects(values: string[][]): Record<string, string[]>[] {
  const [header, ...rows] = values
  if (!header) return []
  return rows.map((row) => {
    const grouped: Record<string, string[]> = {}
    header.forEach((key, i) => {
      ;(grouped[key] ??= []).push(row[i] ?? "")
    })
    return grouped
  })
}

function mapFields(
  raw: Record<string, string[]>,
  fields: Record<string, string>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(fields).map(([canonical, header]) => [
      canonical,
      firstNonEmpty(...(raw[header] ?? [])),
    ])
  )
}

export async function readSource(source: SourceConfig): Promise<Record<string, string>[]> {
  const values = await fetchSheetRange(source.spreadsheet.spreadsheetId, source.spreadsheet.range)
  const rawRows = rowsToObjects(values)

  const rows: Record<string, string>[] = []
  rawRows.forEach((raw, index) => {
    if (source.filter) {
      const columnValue = firstNonEmpty(...(raw[source.filter.column] ?? []))
      if (columnValue !== source.filter.equals) return
    }

    let mapped: Record<string, string> | null = mapFields(raw, source.fields)
    if (source.transform) mapped = source.transform(mapped, raw, index)
    if (!mapped) return
    if (!mapped[source.sourceRowKey]?.trim()) return

    rows.push(mapped)
  })
  return rows
}

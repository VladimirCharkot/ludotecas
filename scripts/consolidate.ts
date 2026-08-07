// Corre la consolidación: lee las fuentes de Drive, matchea ludotecas contra
// escuelas, y escribe el resultado en la planilla maestra. Disparo puramente
// manual — sin cron ni Apps Script (ver app/api/consolidate/route.ts para el
// mismo entrypoint vía HTTP).
// Uso:
//   bun run consolidate            corre y escribe en la planilla maestra
//   bun run consolidate --dry-run  solo calcula y muestra el resumen
import { runConsolidation } from "../lib/consolidation/run"

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const summary = await runConsolidation({ dryRun })
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

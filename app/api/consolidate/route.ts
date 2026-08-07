import "server-only"
import { timingSafeEqual } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { runConsolidation } from "@/lib/consolidation/run"

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CONSOLIDATE_SECRET
  if (!expected) return false

  const header = request.headers.get("authorization") ?? ""
  const [scheme, token] = header.split(" ")
  if (scheme !== "Bearer" || !token) return false

  const expectedBuf = Buffer.from(expected)
  const tokenBuf = Buffer.from(token)
  if (expectedBuf.length !== tokenBuf.length) return false
  return timingSafeEqual(expectedBuf, tokenBuf)
}

// Trigger manual: un operador la llama a mano (curl, Postman, etc.) cuando
// quiere refrescar la planilla maestra sin usar la terminal. No hay ningún
// disparo automático (ni cron ni Apps Script) hacia esta ruta.
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const summary = await runConsolidation()
  return NextResponse.json(summary)
}

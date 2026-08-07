// lib/google-auth.ts
// Sin "server-only": lo usan tanto rutas de Next como scripts/consolidate.ts,
// que corre standalone con `bun run` fuera del bundler de Next (mismo motivo
// por el que scripts/seed-escuelas.ts, ya eliminado, evitaba ese import).
import { JWT } from "google-auth-library"

function getServiceAccountCredentials() {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64
  if (!b64) throw new Error("Falta GOOGLE_SERVICE_ACCOUNT_KEY_B64")
  return JSON.parse(Buffer.from(b64, "base64").toString("utf-8"))
}

export function getSheetsAuthClient() {
  const creds = getServiceAccountCredentials()
  return new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  })
}

// Solo para el script/ruta de consolidación (necesita escribir en la
// planilla maestra). La página del mapa sigue usando el cliente de solo
// lectura de arriba — menor privilegio en el camino que de verdad se sirve.
export function getSheetsWriteAuthClient() {
  const creds = getServiceAccountCredentials()
  return new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  })
}

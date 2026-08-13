import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"

/**
 * Lo que separa las vistas de docente de las de estudiante.
 *
 * El problema: si la hoja del profe vive en /profe/K7QM2X, cualquiera
 * con el enlace del desafío cambia una palabra en la URL y tiene la
 * respuesta. Y si el panel del profe vive en una ruta fija, también
 * se adivina desde ahí.
 *
 * La solución:
 *   · El panel del generador vive detrás de la clave: /panel/<clave>.
 *   · Cada hoja del profe lleva una firma HMAC de la clave y el id:
 *     /profe/K7QM2X/<firma>. La firma no se puede calcular sin la
 *     clave, y a la vez no la revela — así se puede pasar el enlace
 *     de un módulo suelto a otro docente sin darle la llave de todo.
 *
 * `server-only` hace que el build falle si algún componente cliente
 * llega a importar este archivo por accidente.
 */

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const LARGO_FIRMA = 8
const LARGO_MINIMO = 12

/**
 * Sin CABLES_SECRETO configurado, las firmas se calculan con esto y
 * por lo tanto son adivinables: sirve para que el módulo funcione en
 * desarrollo, no para proteger nada. Las vistas de docente avisan.
 */
const SIN_CONFIGURAR = "cables:secreto-no-configurado"

export function haySecreto(): boolean {
  return (process.env.CABLES_SECRETO ?? "").trim().length >= LARGO_MINIMO
}

function secreto(): string {
  return haySecreto() ? process.env.CABLES_SECRETO!.trim() : SIN_CONFIGURAR
}

/** Los 8 caracteres que autorizan la hoja de un módulo puntual. */
export function firmaDe(id: string): string {
  const bytes = createHmac("sha256", secreto())
    .update("cables:profe:" + id)
    .digest()
  let firma = ""
  // 256 es múltiplo de 32, así que el módulo no sesga el alfabeto.
  for (let i = 0; i < LARGO_FIRMA; i++) {
    firma += ALFABETO[bytes[i] % ALFABETO.length]
  }
  return firma
}

export function firmaValida(id: string, firma: string): boolean {
  return iguales(firma.toUpperCase(), firmaDe(id))
}

export function claveValida(clave: string): boolean {
  return iguales(clave, secreto())
}

/** Comparación de tiempo constante, para no filtrar por dónde falla. */
function iguales(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8")
  const bb = Buffer.from(b, "utf8")
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

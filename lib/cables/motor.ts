/**
 * Módulo de Cables — motor
 *
 * Funciones puras, sin DOM y sin estado global. Todo lo que define
 * un módulo se deriva de su id: el id ES la semilla. Mismo id ⇒
 * mismos cables, mismo serial, misma respuesta, siempre.
 *
 * Se importa tanto desde componentes de servidor (planilla, hoja del
 * profe) como de cliente (generador). Nada acá toca `window`.
 */

import { COLORES, contar, type Color } from "./colores"

export { COLORES, HEX, HEX_BRILLO, contar } from "./colores"
export type { Color } from "./colores"
export { RUTA_BASE, rutas } from "./rutas"

/* ============================================================
   Semilla determinista
   ------------------------------------------------------------
   Alfabeto sin caracteres confundibles (sin I, O, 0, 1) y con un
   dígito verificador al final: si alguien tipea mal el código, la
   vista lo rechaza en vez de mostrar silenciosamente un módulo
   distinto al del compañero.
   ============================================================ */

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const RE_ID = /^[A-HJ-NP-Z2-9]{6}$/
const LARGO_BASE = 5

/** FNV-1a con avalancha final. */
function hash32(texto: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  h ^= h >>> 15
  h = Math.imul(h, 2246822507)
  h ^= h >>> 13
  h = Math.imul(h, 3266489909)
  h ^= h >>> 16
  return h >>> 0
}

/** mulberry32: barato, determinista y suficiente para esto. */
function prng(semilla: number): () => number {
  let a = semilla >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function verificador(base: string): string {
  return ALFABETO[hash32("cables:chk:" + base) % ALFABETO.length]
}

/**
 * Limpia lo que tipeó una persona y mapea los caracteres que no
 * existen en el alfabeto a su vecino probable (O→Q, I→J, 0→Q, 1→J).
 */
export function normalizarId(texto: string | null | undefined): string {
  return String(texto ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/[O0]/g, "Q")
    .replace(/[I1]/g, "J")
}

export function idValido(id: string): boolean {
  return RE_ID.test(id) && verificador(id.slice(0, LARGO_BASE)) === id[LARGO_BASE]
}

function idDesde(rnd: () => number): string {
  let base = ""
  for (let i = 0; i < LARGO_BASE; i++) {
    base += ALFABETO[Math.floor(rnd() * ALFABETO.length)]
  }
  return base + verificador(base)
}

/** Nuevo id al azar. No determinista: solo para el generador. */
export function generarId(): string {
  return idDesde(Math.random)
}

/**
 * Un id cuyo módulo tiene exactamente `n` cables (o cualquiera si
 * `n` es null). El id queda opaco: la cantidad no está codificada
 * en los caracteres, se busca por prueba y error.
 */
export function generarIdCon(n: number | null): string {
  if (!n) return generarId()
  for (let i = 0; i < 500; i++) {
    const id = generarId()
    if (moduloDesdeId(id).n === n) return id
  }
  return generarId() // salida de emergencia; no debería ocurrir
}

/**
 * Los códigos de un lote, derivados del id del lote.
 *
 * Deterministas a propósito: el docente puede recargar la tabla,
 * marcarla o compartirla y le salen los mismos códigos. Si se
 * generaran al azar en cada request, un F5 le cambiaría los códigos
 * que ya repartió.
 */
export function idsDeLote(
  loteId: string,
  cuantos: number,
  n: number | null
): string[] {
  const rnd = prng(hash32("cables:lote:" + loteId))
  const ids: string[] = []
  const vistos = new Set<string>()
  const techo = cuantos * 2000 + 5000

  for (let i = 0; i < techo && ids.length < cuantos; i++) {
    const id = idDesde(rnd)
    if (vistos.has(id)) continue
    if (n && moduloDesdeId(id).n !== n) continue
    vistos.add(id)
    ids.push(id)
  }
  return ids
}

/* ============================================================
   Reglas
   ------------------------------------------------------------
   Cada regla lleva su propio texto. La planilla imprime `texto` y
   el motor evalúa `test` en el mismo orden, así que la hoja que
   tiene el grupo y la respuesta del profe no pueden divergir: son
   el mismo array.

   En `texto`, lo que va entre asteriscos se resalta al renderizar
   (ver `components/cables/enfasis.tsx`). Sin HTML embebido.
   ============================================================ */

export type Regla = {
  texto: string
  test: (colores: readonly Color[], ultimoDigito: number) => boolean
  indice: (colores: readonly Color[], ultimoDigito: number) => number
}

const SIEMPRE = () => true

/** Dos cables uno al lado del otro, del mismo color. */
function hayAdyacentesIguales(colores: readonly Color[]): boolean {
  return colores.some((c, i) => i > 0 && c === colores[i - 1])
}

export const REGLAS: Record<number, readonly Regla[]> = {
  3: [
    {
      texto:
        "Si el *primer cable* y el *último cable* son *del mismo color*, cortá el *segundo* cable.",
      test: (c) => c[0] === c[c.length - 1],
      indice: () => 1,
    },
    {
      texto: "Si no, si el *segundo cable es negro*, cortá el *último* cable.",
      test: (c) => c[1] === "negro",
      indice: (c) => c.length - 1,
    },
    {
      texto:
        "Si no, si *hay algún cable amarillo*, cortá el *primer cable amarillo*.",
      test: (c) => contar(c, "amarillo") > 0,
      indice: (c) => c.indexOf("amarillo"),
    },
    {
      texto: "Si no, cortá el *último* cable.",
      test: SIEMPRE,
      indice: (c) => c.length - 1,
    },
  ],
  4: [
    {
      texto:
        "Si *hay dos cables adyacentes del mismo color* y el *último dígito del serial es par*, cortá el *tercer* cable.",
      test: (c, d) => hayAdyacentesIguales(c) && d % 2 === 0,
      indice: () => 2,
    },
    {
      texto:
        "Si no, si el *primer cable es blanco* y *no hay cables negros*, cortá el *segundo* cable.",
      test: (c) => c[0] === "blanco" && contar(c, "negro") === 0,
      indice: () => 1,
    },
    {
      texto:
        "Si no, si hay *exactamente un cable negro*, cortá ese *cable negro*.",
      test: (c) => contar(c, "negro") === 1,
      indice: (c) => c.lastIndexOf("negro"),
    },
    {
      texto:
        "Si no, si *hay tres o más colores distintos* entre los cuatro cables, cortá el *cuarto* cable.",
      test: (c) => new Set(c).size >= 3,
      indice: () => 3,
    },
    {
      texto: "Si no, cortá el *primer* cable.",
      test: SIEMPRE,
      indice: () => 0,
    },
  ],
  5: [
    {
      texto:
        "Si el *cable del medio es rojo* y el *último dígito del serial es impar*, cortá el *cable del medio*.",
      test: (c, d) => c[2] === "rojo" && d % 2 === 1,
      indice: () => 2,
    },
    {
      texto:
        "Si no, si hay *exactamente dos cables blancos*, cortá el *primer cable blanco*.",
      test: (c) => contar(c, "blanco") === 2,
      indice: (c) => c.indexOf("blanco"),
    },
    {
      texto: "Si no, si *no hay ningún cable azul*, cortá el *cuarto* cable.",
      test: (c) => contar(c, "azul") === 0,
      indice: () => 3,
    },
    {
      texto: "Si no, cortá el *último* cable.",
      test: SIEMPRE,
      indice: (c) => c.length - 1,
    },
  ],
  6: [
    {
      texto:
        "Si el *primer cable* y el *segundo cable* son *del mismo color*, cortá el *tercer* cable.",
      test: (c) => c[0] === c[1],
      indice: () => 2,
    },
    {
      texto:
        "Si no, si hay *tres o más cables negros*, cortá el *primer cable negro*.",
      test: (c) => contar(c, "negro") >= 3,
      indice: (c) => c.indexOf("negro"),
    },
    {
      texto:
        "Si no, si hay *exactamente dos cables amarillos*, cortá el *cuarto* cable.",
      test: (c) => contar(c, "amarillo") === 2,
      indice: () => 3,
    },
    {
      texto: "Si no, cortá el *último* cable.",
      test: SIEMPRE,
      indice: (c) => c.length - 1,
    },
  ],
}

export const CANTIDADES: readonly number[] = Object.keys(REGLAS)
  .map(Number)
  .sort((a, b) => a - b)

export type EstadoRegla = "aplica" | "descartada" | "no-evaluada"

export type PasoTraza = { texto: string; estado: EstadoRegla }

/**
 * Evalúa las reglas en orden y devuelve el índice (0-based) del
 * cable correcto, más la traza de qué regla se aplicó y cuáles se
 * descartaron. La traza es lo que le permite al profe explicar
 * dónde se equivocó el grupo, en vez de solo cantar el número.
 */
export function resolver(
  colores: readonly Color[],
  ultimoDigito: number
): { correcto: number; traza: PasoTraza[] } {
  const reglas = REGLAS[colores.length]
  if (!reglas) {
    throw new Error("Cantidad de cables no soportada: " + colores.length)
  }

  const traza: PasoTraza[] = []
  let correcto: number | null = null

  for (const regla of reglas) {
    if (correcto !== null) {
      traza.push({ texto: regla.texto, estado: "no-evaluada" })
    } else if (regla.test(colores, ultimoDigito)) {
      correcto = regla.indice(colores, ultimoDigito)
      traza.push({ texto: regla.texto, estado: "aplica" })
    } else {
      traza.push({ texto: regla.texto, estado: "descartada" })
    }
  }

  // La última regla de cada grupo es un `else` incondicional, así
  // que esto no puede pasar; el chequeo está para que un cambio
  // futuro en REGLAS falle acá y no en la cara del grupo.
  if (correcto === null) {
    throw new Error("Ninguna regla resolvió el módulo de " + colores.length)
  }

  return { correcto, traza }
}

/* ============================================================
   Serial
   ============================================================ */

function generarSerial(rnd: () => number): string {
  let s = ""
  for (let i = 0; i < 5; i++) {
    s += ALFABETO[Math.floor(rnd() * ALFABETO.length)]
  }
  // El último caracter siempre es un dígito: las reglas dependen
  // de su paridad, así que no puede faltar.
  return s + String(Math.floor(rnd() * 10))
}

export function ultimoDigitoDe(serial: string): number {
  const m = serial.match(/(\d)(?!.*\d)/)
  return m ? parseInt(m[1], 10) : 0
}

export function paridad(digito: number): "par" | "impar" {
  return digito % 2 === 1 ? "impar" : "par"
}

/* ============================================================
   El módulo
   ============================================================ */

/** Lo que se puede ver del módulo sin saber la respuesta. */
export type ModuloVisible = {
  id: string
  n: number
  colores: Color[]
  serial: string
}

/** Lo que necesita el desafío interactivo para dar el veredicto. */
export type ModuloJugable = ModuloVisible & { correcto: number }

/** El módulo completo, con la traza. Solo para la hoja del profe. */
export type Modulo = ModuloJugable & {
  digito: number
  traza: PasoTraza[]
}

export function moduloDesdeId(id: string): Modulo {
  const rnd = prng(hash32("cables:v1:" + id))

  const n = CANTIDADES[Math.floor(rnd() * CANTIDADES.length)]

  const colores: Color[] = []
  for (let i = 0; i < n; i++) {
    colores.push(COLORES[Math.floor(rnd() * COLORES.length)])
  }

  const serial = generarSerial(rnd)
  const digito = ultimoDigitoDe(serial)
  const { correcto, traza } = resolver(colores, digito)

  return { id, n, colores, serial, digito, correcto, traza }
}

/** Recorta el módulo a lo que puede cruzar al cliente del desafío. */
export function soloJugable(m: Modulo): ModuloJugable {
  return { id: m.id, n: m.n, colores: m.colores, serial: m.serial, correcto: m.correcto }
}

export function conteos(colores: readonly Color[]) {
  return COLORES.map((color) => ({ color, cantidad: contar(colores, color) }))
}

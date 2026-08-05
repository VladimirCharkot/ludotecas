/**
 * Rutas de las vistas del módulo.
 *
 * Aparte de `motor.ts` para que un componente que solo arma enlaces
 * no arrastre la tabla de reglas al navegador. La firma de las hojas
 * de profe entra como argumento: se calcula en el servidor, en
 * `secreto.ts`, y este archivo no sabe nada de la clave.
 */

export const RUTA_BASE = "/sala-de-escape/cables"

export const rutas = {
  /** Página pública: explica el juego, no genera nada. */
  inicio: RUTA_BASE,

  /** Lo que ve quien corta el cable. Público a propósito. */
  desafio: (id: string) => `${RUTA_BASE}/desafio/${id}`,

  /** La planilla de reglas. Pública: es el manual del juego. */
  planilla: () => `${RUTA_BASE}/planilla`,

  /** Hoja del profe de un módulo. Necesita la firma del id. */
  profe: (id: string, firma: string) => `${RUTA_BASE}/profe/${id}/${firma}`,

  /** El generador. Detrás de la clave de docente. */
  panel: (clave: string, params?: Record<string, string | number>) => {
    const base = `${RUTA_BASE}/panel/${encodeURIComponent(clave)}`
    if (!params) return base
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    )
    return `${base}?${qs}`
  },
}

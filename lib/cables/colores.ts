/**
 * Paleta de los cables.
 *
 * Vive aparte de `motor.ts` a propósito: el tablero necesita los
 * colores y el tablero se renderiza también en el cliente, así que
 * si la paleta estuviera junto a las REGLAS, el bundle del desafío
 * se llevaría la tabla de reglas entera —y con ella la forma de
 * calcular la respuesta— al navegador de quien juega.
 */

export const COLORES = ["rojo", "blanco", "azul", "amarillo", "negro"] as const

export type Color = (typeof COLORES)[number]

export const HEX: Record<Color, string> = {
  rojo: "#c93a30",
  blanco: "#f0ece0",
  azul: "#3d7fb0",
  // Un negro puro se pierde contra el fondo oscuro del panel; este
  // sigue leyéndose como negro al lado de los otros cuatro.
  negro: "#43464a",
  amarillo: "#d9b53f",
}

/** Brillo del cable, para que se lea como cable y no como línea. */
export const HEX_BRILLO: Record<Color, string> = {
  rojo: "#e4635a",
  blanco: "#ffffff",
  azul: "#6aa8d4",
  negro: "#6c7077",
  amarillo: "#f0d271",
}

export function contar(colores: readonly Color[], color: Color): number {
  return colores.filter((c) => c === color).length
}

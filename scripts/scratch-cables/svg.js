// Genera los SVG de costumes a mano (rectangulos simples), para no
// depender de ningun asset externo. Los colores vienen de
// lib/cables/colores.ts, asi que el cable en Scratch usa la misma
// paleta que el desafio web.

// Copiados a mano de lib/cables/colores.ts (no podemos requerir un .ts
// desde este script plano de Node). Si esa paleta cambia, actualizar aca.
const HEX = {
  rojo: "#c93a30",
  blanco: "#f0ece0",
  azul: "#3d7fb0",
  negro: "#43464a",
  amarillo: "#d9b53f",
}
const HEX_BRILLO = {
  rojo: "#e4635a",
  blanco: "#ffffff",
  azul: "#6aa8d4",
  negro: "#6c7077",
  amarillo: "#f0d271",
}

const ANCHO = 64
const ALTO = 176
const CX = ANCHO / 2
const CY = ALTO / 2

// El cable ocupa la mitad de abajo; arriba queda lugar para el numero.
const CABLE_Y = 40
const CABLE_ALTO = ALTO - CABLE_Y - 8
const CABLE_ANCHO = 34
const CABLE_X = CX - CABLE_ANCHO / 2

/** El cable en si, con un brillo lateral para que se lea como cable. */
function cableSvg(color, numero) {
  const hex = HEX[color]
  const brillo = HEX_BRILLO[color]
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}" viewBox="0 0 ${ANCHO} ${ALTO}">
  <circle cx="${CX}" cy="16" r="15" fill="#20232a" stroke="#f0ece0" stroke-width="2"/>
  <text x="${CX}" y="16" text-anchor="middle" dominant-baseline="central" font-family="Helvetica, Arial, sans-serif" font-size="18" font-weight="bold" fill="#f0ece0">${numero}</text>
  <rect x="${CABLE_X}" y="${CABLE_Y}" width="${CABLE_ANCHO}" height="${CABLE_ALTO}" rx="12" fill="${hex}" stroke="#f0ece0" stroke-width="2"/>
  <rect x="${CABLE_X + 6}" y="${CABLE_Y + 8}" width="7" height="${CABLE_ALTO - 16}" rx="3.5" fill="${brillo}" opacity="0.7"/>
</svg>`
}

/** Fondo del escenario: titulo + instrucciones basicas. */
function fondoSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
  <rect width="480" height="360" fill="#1b1f27"/>
  <rect x="0" y="0" width="480" height="70" fill="#20232a"/>
  <text x="240" y="38" text-anchor="middle" dominant-baseline="central" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="bold" fill="#f0ece0">Modulo de cables</text>
  <text x="240" y="320" text-anchor="middle" dominant-baseline="central" font-family="Helvetica, Arial, sans-serif" font-size="16" fill="#c9cdd6">Elegi el cable correcto segun la planilla.</text>
  <text x="240" y="342" text-anchor="middle" dominant-baseline="central" font-family="Helvetica, Arial, sans-serif" font-size="16" fill="#c9cdd6">Bandera verde = modulo nuevo.</text>
</svg>`
}

/** Icono chico para el sprite que muestra los mensajes (globo). */
function iconoMensajeSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="40" viewBox="0 0 48 40">
  <path d="M4 4 h40 a4 4 0 0 1 4 4 v18 a4 4 0 0 1 -4 4 h-24 l-10 8 v-8 h-6 a4 4 0 0 1 -4 -4 v-18 a4 4 0 0 1 4 -4 z" fill="#f0ece0" stroke="#20232a" stroke-width="2"/>
  <circle cx="16" cy="17" r="3" fill="#20232a"/>
  <circle cx="24" cy="17" r="3" fill="#20232a"/>
  <circle cx="32" cy="17" r="3" fill="#20232a"/>
</svg>`
}

module.exports = {
  ANCHO,
  ALTO,
  CX,
  CY,
  cableSvg,
  fondoSvg,
  iconoMensajeSvg,
}

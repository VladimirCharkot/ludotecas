// Helpers de cliente compartidos entre el mapa admin
// (app/admin/map/[secret]) y el mapa público (app/relevamiento) — carga de
// Google Maps, generación del ícono SVG por color, y formateo de texto.

export const CORDOBA_CAPITAL = { lat: -31.4201, lng: -64.1888 }

// Colores que ambos mapas comparten (el admin además tiene sus propios
// colores por programa de Maestra — ver MapView.tsx).
export const COLOR_ESCOLAR = "#dc2626" // relevamiento, con escuela resuelta -> rojo
export const COLOR_NO_ESCOLAR = "#f97316" // relevamiento, sin escuela -> naranja

// El seleccionado usa el tamaño "nítido" (32); el resto achica un poco para
// que el highlight se note sin necesitar upscaling, que pixela el ícono.
export const MARKER_SIZE_BASE = 26
export const MARKER_SIZE_SELECTED = 32

const PIN_SVG_URL = "/assets/pin-mapa.svg"
const PIN_FILL_ID = "pin-fill"
// public/assets/pin-mapa.svg es un pin tipo "globo" (viewBox 0 0 62 62), no
// un punto centrado como el ícono viejo de Google -- la punta que marca la
// ubicación real está en (32,59), no en el centro (31,31). Sin este ajuste
// el pin queda flotando arriba a la izquierda de la coordenada real.
const PIN_ANCHOR_X_RATIO = 32 / 62
const PIN_ANCHOR_Y_RATIO = 59 / 62

// Carga el SVG una sola vez y devuelve una función que, dado un color, arma
// el data URL con el path #pin-fill pintado de ese color (cacheado por color
// para no reparsear/reserializar en cada marker). Vía DOMParser en vez de
// reemplazo de texto: más robusto que un regex contra el XML del archivo.
export async function loadPinIconFactory(): Promise<(color: string) => string> {
  const template = await fetch(PIN_SVG_URL).then((res) => res.text())
  const cache = new Map<string, string>()

  return (color: string) => {
    const cached = cache.get(color)
    if (cached) return cached

    const doc = new DOMParser().parseFromString(template, "image/svg+xml")
    const fillPath = doc.getElementById(PIN_FILL_ID)
    fillPath?.setAttribute("style", `fill:${color};`)
    const svg = new XMLSerializer().serializeToString(doc)
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
    cache.set(color, dataUrl)
    return dataUrl
  }
}

export function pinIcon(
  makeIconUrl: (color: string) => string,
  color: string,
  size: number
): google.maps.Icon {
  return {
    url: makeIconUrl(color),
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(
      size * PIN_ANCHOR_X_RATIO,
      size * PIN_ANCHOR_Y_RATIO
    ),
  }
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ")
}

export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (window.google?.maps) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("No se pudo cargar Google Maps"))
    document.head.appendChild(script)
  })
}

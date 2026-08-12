export interface Coordinates {
  lat: number
  lng: number
}

interface GeocodeResult {
  types: string[]
  geometry: { location: Coordinates }
}

// Ninguna dirección que geocodificamos acá busca una calle sin número (ni
// domicilio de escuela ni centro de localidad) — así que un resultado tipo
// "route" nunca es la mejor respuesta cuando hay otra alternativa. Hace
// falta porque Google puede devolver varios candidatos para la misma
// consulta y no siempre ordena la localidad primero: "Cura Brochero" es a la
// vez una calle en Córdoba capital y una localidad real en Traslasierra
// (nombre oficial "Villa Cura Brochero"), y el geocoder devuelve la calle en
// la posición 0 por matchear el texto más literalmente.
function mejorResultado(results: GeocodeResult[]): GeocodeResult | undefined {
  return results.find((r) => !r.types.includes("route")) ?? results[0]
}

export async function geocodeAddress(
  address: string
): Promise<Coordinates | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY
  if (!key) throw new Error("Falta GOOGLE_MAPS_API_KEY")

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&region=ar&key=${key}`
  const res = await fetch(url)
  const data = await res.json()

  if (data.status !== "OK" || !data.results?.length) return null
  const best = mejorResultado(data.results)
  if (!best) return null
  const { lat, lng } = best.geometry.location

  return { lat, lng }
}

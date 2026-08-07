// Sin "server-only": lo usan tanto rutas de Next como scripts/consolidate.ts
// standalone (ver nota en lib/google-auth.ts).

export interface Coordinates {
  lat: number
  lng: number
}

export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY
  if (!key) throw new Error("Falta GOOGLE_MAPS_API_KEY")

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&region=ar&key=${key}`
  const res = await fetch(url)
  const data = await res.json()

  if (data.status !== "OK" || !data.results?.[0]) return null
  const { lat, lng } = data.results[0].geometry.location
  return { lat, lng }
}

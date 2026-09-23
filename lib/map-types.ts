export interface Pin {
  id: string
  nombre: string
  localidad: string
  departamento: string
  lat: number
  lng: number
  escuela: {
    nombre: string
    cue: string
    domicilio: string
    localidad: string
    departamento: string
    orientacion: string | null
  } | null
  // Programas de Maestra en los que apareció esta institución ("50
  // Ludotecas", "PIBE", etc.) — vacío si el pin viene solo del form.
  fuentes: string[]
  payload: Record<string, string>
}

// Versión del pin para el mapa público (/relevamiento): sin nada de la info
// de la institución ni del formulario, ni aún al hacer click -- solo nombre,
// ubicación y a qué categoría(s) pertenece.
export interface PublicPin {
  id: string
  nombre: string
  lat: number
  lng: number
  kinds: string[]
}

export interface SinCoordenadas {
  id: string
  nombre: string
  localidad: string
  departamento: string
}

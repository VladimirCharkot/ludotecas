export interface Pin {
  id: string
  nombre: string
  localidad: string
  departamento: string
  lat: number
  lng: number
  // El color del pin en el mapa se deriva de fuentes/escuela en MapView, no
  // se persiste ni se calcula acá — ver pinColor() en MapView.tsx.
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

export interface SinCoordenadas {
  id: string
  nombre: string
  localidad: string
  departamento: string
}

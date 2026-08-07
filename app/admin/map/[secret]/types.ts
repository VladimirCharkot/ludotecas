export type PinColor = "auto" | "revision" | "sin_escuela"

export interface Pin {
  ludotecaId: number
  nombre: string
  localidad: string
  departamento: string
  lat: number
  lng: number
  color: PinColor
  escuela: {
    nombre: string
    cue: string
    domicilio: string
    localidad: string
    departamento: string
    orientacion: string | null
  } | null
  payload: Record<string, string>
}

export interface SinCoordenadas {
  ludotecaId: number
  nombre: string
  localidad: string
  departamento: string
}

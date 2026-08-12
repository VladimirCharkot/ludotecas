// Campos del form que se exponen en la página pública /relevamiento --
// compartido entre app/relevamiento/page.tsx (filtra el payload) y
// PublicMapView.tsx (los renderiza), así que no puede vivir en un archivo
// "server-only".
export const CAMPO_CONTACTO = "Docente referente de la ludoteca"

export const CAMPOS_SOBRE_LUDOTECA = [
  "¿En qué etapa se encuentra su proyecto/ludoteca?",
  "¿Con estudiante de qué nivel trabajan principalmente?",
  "¿Qué tipos de juego predominan o les interesan más?",
  "Si tuvieran que describir su ludoteca en pocas palabras, ¿cómo sería?",
  "¿Tienen alguna meta para su ludoteca este año?",
]

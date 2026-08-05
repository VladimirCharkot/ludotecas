import type { Metadata } from "next"
import { Desafio } from "@/components/cables/desafio"
import { CodigoInvalido } from "@/components/cables/codigo-invalido"
import {
  idValido,
  moduloDesdeId,
  normalizarId,
  soloJugable,
} from "@/lib/cables/motor"
import styles from "@/components/cables/cables.module.css"

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Desafío ${normalizarId(id)} — Módulo de Cables`,
    robots: { index: false },
  }
}

export default async function DesafioPage({ params }: Params) {
  const id = normalizarId((await params).id)

  if (!idValido(id)) {
    return <CodigoInvalido id={id} />
  }

  // El módulo se resuelve en el servidor y al cliente solo cruza lo
  // jugable: los cables, el serial y el índice correcto. Las REGLAS
  // no entran en el bundle de esta ruta.
  const modulo = soloJugable(moduloDesdeId(id))

  return (
    <div className={`${styles.wrap} ${styles.angosto}`}>
      <header>
        <div className={styles.eyebrow}>Sala de escape — módulo {id}</div>
        <h1 className={styles.titulo}>Cortá el cable correcto</h1>
        <p className={styles.parrafo}>
          Tu compañero tiene la planilla de reglas, pero no puede ver el
          módulo. Describile en voz alta cuántos cables hay, de qué color es
          cada uno de arriba hacia abajo, y el número de serie. Cuando te diga
          cuál cortar, hacé clic sobre ese cable.
        </p>
      </header>

      <Desafio modulo={modulo} />
    </div>
  )
}

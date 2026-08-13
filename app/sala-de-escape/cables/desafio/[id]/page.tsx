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

const DESCRIPCION =
  "Describí los cables y el número de serie a tu compañero, que tiene la planilla de reglas. Ninguno ve la pantalla del otro."

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const titulo = `Desafío ${normalizarId(id)} — Módulo de Cables`
  return {
    title: titulo,
    description: DESCRIPCION,
    robots: { index: false },
    openGraph: {
      title: titulo,
      description: DESCRIPCION,
    },
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
      <header className="mb-8">
        <div className={styles.eyebrow}>Sala de escape — módulo {id}</div>
        <h1 className={styles.titulo}>Cortá el cable correcto</h1>
        <p className={styles.parrafo}>
          Para saber cuál cortar, comunicate con tu compañero que tiene la
          planilla de reglas.{" "}
          <strong>Nadie ve la pantalla de la otra persona.</strong>
        </p>
      </header>

      <Desafio modulo={modulo} />
    </div>
  )
}

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  DatosModulo,
  Respuesta,
  TrazaReglas,
} from "@/components/cables/ficha-modulo"
import { Tablero } from "@/components/cables/tablero"
import { BotonImprimir } from "@/components/cables/boton-imprimir"
import { idValido, moduloDesdeId, normalizarId } from "@/lib/cables/motor"
import { rutas } from "@/lib/cables/rutas"
import { firmaValida, haySecreto } from "@/lib/cables/secreto"
import styles from "@/components/cables/cables.module.css"

const TITULO = "Hoja del profe — Módulo de Cables"
const DESCRIPCION =
  "La respuesta del módulo y el razonamiento paso a paso, para quien coordina el juego."

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRIPCION,
  robots: { index: false, follow: false },
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
  },
}

type Params = { params: Promise<{ id: string; firma: string }> }

/**
 * Hoja del profe.
 *
 * La ruta lleva la firma del módulo: /profe/K7QM2X/AB3KF9QM. Sin la
 * firma correcta, 404 — así nadie llega acá cambiando "desafio" por
 * "profe" en la URL del desafío. La firma se calcula con la clave del
 * docente (ver lib/cables/secreto.ts) y no la revela, así que este
 * enlace se le puede pasar a otro docente sin darle la llave de todo.
 *
 * Componente de servidor: si la firma no valida, nada del módulo
 * llega a renderizarse.
 */
export default async function ProfePage({ params }: Params) {
  const { id: idCrudo, firma } = await params
  const id = normalizarId(idCrudo)

  if (!idValido(id) || !firmaValida(id, firma)) {
    notFound()
  }

  const modulo = moduloDesdeId(id)

  return (
    <div className={styles.wrap}>
      <header className="mb-8">
        <div className={styles.eyebrow}>Hoja del profe — módulo {id}</div>
        <h1 className={styles.titulo}>Respuesta y razonamiento</h1>
        <p className={styles.parrafo}>
          Todo lo de esta hoja se deriva del código del módulo. Si el grupo se
          traba, la traza de abajo te dice exactamente en qué regla se
          equivocaron.
        </p>
      </header>

      {!haySecreto() && (
        <section className={styles.panel}>
          <p className={styles.aviso} style={{ marginTop: 0 }}>
            ⚠ No hay <code>CABLES_SECRETO</code> configurado, así que la firma
            de esta URL es adivinable. Definí la variable de entorno antes de
            usar esto con estudiantes.
          </p>
        </section>
      )}

      <section className={styles.panel}>
        <Respuesta modulo={modulo} />
      </section>

      <section className={styles.panel}>
        <h2 className={styles.subtitulo}>Datos del módulo</h2>
        <DatosModulo modulo={modulo} />
      </section>

      <section className={styles.panel}>
        <h2 className={styles.subtitulo}>Cómo se llega a esa respuesta</h2>
        <p className={styles.parrafo} style={{ marginBottom: 12 }}>
          Reglas para <strong>{modulo.n} cables</strong>, en orden. Tachadas las
          que no se cumplen; marcada la primera que sí. Es la misma lista que
          tiene el grupo en la <Link href={rutas.planilla()}>planilla</Link>.
        </p>
        <TrazaReglas modulo={modulo} />
      </section>

      <section className={styles.panel}>
        <h2 className={styles.subtitulo}>Lo que ve el grupo</h2>
        <Tablero modulo={modulo} />
        <div
          className={`${styles.acciones} ${styles.centro} ${styles.sinImprimir}`}
        >
          <a
            className={styles.boton}
            href={rutas.desafio(id)}
            target="_blank"
            rel="noopener"
          >
            Abrir el desafío interactivo
          </a>
        </div>
      </section>

      <section className={styles.panel}>
        <p className={styles.aviso} style={{ marginTop: 0 }}>
          ⚠ Esta hoja es solo para quien coordina el juego. No la proyectes ni
          la dejes abierta en una pestaña visible. El enlace sí se le puede
          pasar a otro docente: lleva la firma de este módulo, no tu clave.
        </p>
      </section>

      <div className={`${styles.acciones} ${styles.sinImprimir}`}>
        <BotonImprimir>Imprimir esta hoja</BotonImprimir>
      </div>

      <div className={`${styles.pie} ${styles.sinImprimir}`}>
        <Link href={rutas.planilla()}>Ver la planilla de reglas</Link>
      </div>
    </div>
  )
}

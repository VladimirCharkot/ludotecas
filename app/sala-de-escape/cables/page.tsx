import type { Metadata } from "next"
import Link from "next/link"
import { rutas } from "@/lib/cables/rutas"
import styles from "@/components/cables/cables.module.css"

export const metadata: Metadata = {
  title: "Módulo de Cables — Sala de escape",
  description:
    "Un juego de dos: quien tiene el módulo describe los cables, quien tiene la planilla dice cuál cortar.",
}

/**
 * Página pública del módulo.
 *
 * Antes acá vivía el generador, pero era adivinable desde la URL del
 * desafío y mostraba tanto la respuesta como el enlace de la hoja del
 * profe. El generador se mudó a /panel/<clave>; esto quedó como la
 * puerta de entrada para cualquiera.
 */
export default function CablesPage() {
  return (
    <div className={`${styles.wrap} ${styles.angosto}`}>
      <header className="mb-8">
        <div className={styles.eyebrow}>
          Sala de escape — desactivación de cables
        </div>
        <h1 className={styles.titulo}>Módulo de Cables</h1>
        <p className={styles.parrafo}>
          Un juego para dos. Uno tiene un módulo con cables de colores y un
          número de serie; el otro tiene la planilla con las reglas para
          desactivarlo. <strong>Ninguno ve la pantalla del otro.</strong> Para
          abrir la puerta tienen que describirse todo en voz alta y ponerse de
          acuerdo sobre qué cable cortar.
        </p>
      </header>

      <section className={styles.panel}>
        <h2 className={styles.subtitulo}>Para jugar</h2>
        <p className={styles.parrafo}>
          Quien coordina el juego les va a dar un enlace a cada uno. Si te toca
          el módulo, abrí el enlace que te pasaron. Si te toca el manual, la
          planilla es siempre la misma:
        </p>
        <div className={styles.acciones}>
          <Link
            className={`${styles.boton} ${styles.primario}`}
            href={rutas.planilla()}
          >
            Abrir la planilla de reglas
          </Link>
        </div>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.subtitulo}>Para quien coordina</h2>
        <p className={styles.parrafo}>
          El generador de módulos está en{" "}
          <code>
            https://ludotecaseducacion.co/sala-de-escape/cables/panel/&lt;clave&gt;
          </code>
          .
        </p>
      </section>
    </div>
  )
}

import Link from "next/link"
import { rutas } from "@/lib/cables/rutas"
import styles from "./cables.module.css"

/**
 * Un código mal tipeado no da un 404 pelado: el dígito de control
 * ya nos dice que está mal, así que conviene explicarlo. Quien lo
 * está tipeando suele ser un chico copiando de un pizarrón.
 */
export function CodigoInvalido({ id }: { id: string }) {
  return (
    <div className={`${styles.wrap} ${styles.angosto}`}>
      <header>
        <div className={styles.eyebrow}>Sala de escape — módulo de cables</div>
        <h1 className={styles.titulo}>Ese código no existe</h1>
      </header>

      <section className={styles.panel}>
        <p className={styles.parrafo}>
          Escribiste <strong>{id || "(nada)"}</strong>, y no es un código
          válido. Son <strong>6 caracteres</strong>, sin las letras I ni O y sin
          los números 0 ni 1, para que no se confundan al copiarlos.
        </p>
        <p className={styles.parrafo}>
          El último caracter es un dígito de control: si te equivocaste en una
          letra, el error aparece acá en vez de darte un módulo distinto al de
          tu compañero. Revisá el código y volvé a intentar.
        </p>
        <p className={styles.parrafo}>
          Si el código está bien copiado, pedile a quien coordina el juego que
          te pase el enlace de nuevo.
        </p>
        <div className={styles.acciones}>
          <Link
            className={`${styles.boton} ${styles.primario}`}
            href={rutas.planilla()}
          >
            Ver la planilla de reglas
          </Link>
          <Link className={styles.boton} href={rutas.inicio}>
            Cómo se juega
          </Link>
        </div>
      </section>
    </div>
  )
}

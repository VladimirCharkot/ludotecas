import type { Metadata } from "next"
import Link from "next/link"
import {
  LeyendaColores,
  PlanillaReglas,
} from "@/components/cables/planilla-reglas"
import { BotonImprimir } from "@/components/cables/boton-imprimir"
import { CANTIDADES, rutas } from "@/lib/cables/motor"
import styles from "@/components/cables/cables.module.css"

export const metadata: Metadata = {
  title: "Planilla de cables — Sala de escape",
  description:
    "Las reglas para desactivar el módulo de cables: qué cable cortar según cuántos cables hay, de qué color son y el número de serie.",
}

/**
 * La planilla. No depende de ningún código: una sola impresión sirve
 * para todo el taller, que es justo lo que la vuelve el lado
 * "manual" del juego.
 *
 * El filtro por cantidad de cables va por query param y se navega
 * con enlaces, así la página no necesita JavaScript y además queda
 * marcable en "solo 4 cables".
 */
export default async function PlanillaPage({
  searchParams,
}: {
  searchParams: Promise<{ n?: string }>
}) {
  const { n } = await searchParams
  const pedido = Number(n)
  const soloN = CANTIDADES.includes(pedido) ? pedido : undefined

  return (
    <div className={`${styles.wrap} ${styles.angosto}`}>
      <header>
        <div className={styles.eyebrow}>
          Sala de escape — planilla de desactivación
        </div>
        <h1 className={styles.titulo}>Planilla de cables</h1>
        <p className={styles.parrafo}>
          Vos tenés las reglas; tu compañero tiene el módulo. No mires su
          pantalla: preguntale cuántos cables hay, de qué color es cada uno de
          arriba hacia abajo y qué número de serie tiene la placa. Con eso
          buscá acá abajo qué cable hay que cortar y decíselo.
        </p>
      </header>

      <section className={styles.panel}>
        <h2 className={styles.subtitulo}>Antes de empezar</h2>
        <ol className={styles.reglas}>
          <li>
            Los cables se cuentan <b>de arriba hacia abajo</b>, y el primero es
            el <b>1</b>.
          </li>
          <li>
            El <b>último cable</b> es el de más abajo. El <b>primer cable</b> es
            el de más arriba.
          </li>
          <li>
            El <b>último dígito del serial</b> es el último número que aparece
            en el código de la placa. Si es 1, 3, 5, 7 o 9 es <b>impar</b>; si
            es 0, 2, 4, 6 u 8 es <b>par</b>.
          </li>
          <li>
            Aplicá las reglas <b>en orden</b> y detenete en la primera que se
            cumpla. Esa es la respuesta: las de abajo ya no cuentan.
          </li>
        </ol>

        <p className={styles.rotulo} style={{ margin: "20px 0 0" }}>
          Colores posibles
        </p>
        <LeyendaColores />
      </section>

      <section className={`${styles.panel} ${styles.sinImprimir}`}>
        <p className={styles.rotulo} style={{ marginBottom: 10 }}>
          ¿Cuántos cables tiene el módulo?
        </p>
        <div className={styles.filtro}>
          <Link
            className={`${styles.boton} ${styles.chico} ${soloN ? "" : styles.primario}`}
            href={rutas.planilla()}
          >
            todas
          </Link>
          {CANTIDADES.map((cant) => (
            <Link
              key={cant}
              className={`${styles.boton} ${styles.chico} ${soloN === cant ? styles.primario : ""}`}
              href={`${rutas.planilla()}?n=${cant}`}
            >
              {cant} cables
            </Link>
          ))}
          <BotonImprimir>Imprimir la planilla</BotonImprimir>
        </div>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.subtitulo}>Reglas</h2>
        <PlanillaReglas soloN={soloN} />
      </section>

      <div className={`${styles.pie} ${styles.sinImprimir}`}>
        <Link href={rutas.inicio}>Cómo se juega</Link>
      </div>
    </div>
  )
}

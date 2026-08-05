import { CANTIDADES, COLORES, HEX, REGLAS } from "@/lib/cables/motor"
import { Enfasis } from "./enfasis"
import styles from "./cables.module.css"

/**
 * La planilla, renderizada desde REGLAS.
 *
 * Reemplaza al PNG estático: no hay una copia de las reglas que
 * pueda quedar desactualizada respecto del cálculo, porque es el
 * mismo array el que se imprime y el que resuelve el módulo.
 *
 * Componente de servidor: las reglas se renderizan a HTML y nada
 * del motor viaja al navegador.
 */
export function PlanillaReglas({ soloN }: { soloN?: number }) {
  const grupos = soloN ? CANTIDADES.filter((n) => n === soloN) : CANTIDADES

  return (
    <>
      {grupos.map((n) => (
        <section key={n} className={styles.grupoReglas}>
          <h3>Si el módulo tiene {n} cables</h3>
          <ol className={styles.reglas}>
            {REGLAS[n].map((regla, i) => (
              <li key={i}>
                <Enfasis texto={regla.texto} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </>
  )
}

/** Los cinco colores con su muestra, para que no haya dudas. */
export function LeyendaColores() {
  return (
    <ul className={styles.leyenda}>
      {COLORES.map((color) => (
        <li key={color}>
          <span className={styles.muestra} style={{ background: HEX[color] }} />
          <span>{color}</span>
        </li>
      ))}
    </ul>
  )
}

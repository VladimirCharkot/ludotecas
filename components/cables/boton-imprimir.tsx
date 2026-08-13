"use client"

import styles from "./cables.module.css"

/**
 * Lo único que necesita JavaScript en la planilla y en la hoja del
 * profe. Aislarlo en su propio componente cliente deja el resto de
 * esas páginas como componentes de servidor puros.
 */
export function BotonImprimir({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className={styles.boton}
      onClick={() => window.print()}
    >
      {children}
    </button>
  )
}

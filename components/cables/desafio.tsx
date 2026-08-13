"use client"

import type { ModuloJugable } from "@/lib/cables/motor"
import { useDesafio } from "@/lib/cables/use-desafio"
import { Tablero } from "./tablero"
import styles from "./cables.module.css"

/**
 * El desafío interactivo.
 *
 * Recibe el módulo ya resuelto desde el componente de servidor, así
 * que las REGLAS nunca llegan al navegador: lo único que cruza es
 * el índice del cable correcto. Todo el estado de la partida está
 * en useDesafio.
 */
export function Desafio({ modulo }: { modulo: ModuloJugable }) {
  const { cortes, resultado, acierto, intentos, cortar, reiniciar } =
    useDesafio(modulo)

  return (
    <>
      <div
        className={[
          styles.banner,
          acierto === null ? "" : acierto ? styles.ok : styles.mal,
        ]
          .filter(Boolean)
          .join(" ")}
        role="status"
        aria-live="polite"
      >
        {resultado === null
          ? null
          : acierto
            ? `✔ Correcto. El cable ${resultado + 1} (${modulo.colores[resultado]}) estaba bien. Módulo desactivado.`
            : `✘ Cortaste el cable ${resultado + 1} (${modulo.colores[resultado]}). No era ese.`}
      </div>

      <Tablero
        modulo={modulo}
        cortes={cortes}
        resultado={resultado}
        acierto={acierto}
        onCortar={cortar}
      />

      {resultado !== null && (
        <div className={`${styles.acciones} ${styles.centro}`}>
          <button
            type="button"
            className={styles.boton}
            onClick={reiniciar}
            autoFocus
          >
            Reintentar
          </button>
        </div>
      )}

      <p
        className={styles.rotulo}
        style={{ textAlign: "center", margin: "16px 0 0" }}
      >
        Hacé clic en un cable, o usá las teclas 1 – {modulo.n}
      </p>

      {intentos > 0 && (
        <div className={styles.pie}>
          <span>
            {intentos === 1
              ? "1 intento en este módulo."
              : `${intentos} intentos en este módulo.`}
          </span>
        </div>
      )}
    </>
  )
}

import type { CSSProperties } from "react"
// La paleta viene de colores.ts y no de motor.ts a propósito: este
// componente se renderiza también en el cliente, y así las REGLAS
// no entran en el bundle del desafío.
import { HEX, HEX_BRILLO, type Color } from "@/lib/cables/colores"
import type { ModuloVisible } from "@/lib/cables/motor"
import styles from "./cables.module.css"

type Props = {
  modulo: ModuloVisible
  /** Qué cables están cortados. Si falta, ninguno. */
  cortes?: readonly boolean[]
  /** Cable que se cortó en esta ronda, para colorear la marca. */
  resultado?: number | null
  acierto?: boolean | null
  /** Si viene, cada fila es un botón y el tablero se puede jugar. */
  onCortar?: (indice: number) => void
}

/**
 * El módulo dibujado con cajas de CSS.
 *
 * La versión anterior lo dibujaba en un canvas con p5, lo que traía
 * un script de CDN, un ref, medición manual del ancho y un listener
 * de resize — y dejaba el módulo invisible para un lector de
 * pantalla. Acá cada cable es una fila real; cuando el tablero es
 * jugable, cada fila es un <button> con su nombre accesible.
 */
export function Tablero({
  modulo,
  cortes,
  resultado = null,
  acierto = null,
  onCortar,
}: Props) {
  const jugable = typeof onCortar === "function"
  const rondaCerrada = resultado !== null

  return (
    <div className={styles.tablero}>
      <div className={styles.placa}>
        <div className={styles.placaInterior}>
          <span className={styles.placaRotulo}>N.º de serie</span>
          <span className={styles.placaSerial}>{modulo.serial}</span>
        </div>
      </div>

      <ul className={styles.cables}>
        {modulo.colores.map((color, i) => {
          const cortado = cortes?.[i] ?? false
          const contenido = (
            <>
              <span className={styles.numero}>{i + 1}</span>
              <Cable
                color={color}
                cortado={cortado}
                marca={
                  resultado === i ? (acierto ? "ok" : "mal") : "neutra"
                }
              />
              <span className={styles.nombreColor}>{color}</span>
            </>
          )

          return (
            <li key={i}>
              {jugable ? (
                <button
                  type="button"
                  className={styles.fila}
                  onClick={() => onCortar(i)}
                  disabled={rondaCerrada}
                  aria-label={`Cortar el cable ${i + 1}, ${color}`}
                >
                  {contenido}
                </button>
              ) : (
                <div className={styles.fila}>{contenido}</div>
              )}
            </li>
          )
        })}
      </ul>

      <span className={styles.pieTablero}>módulo {modulo.id}</span>
    </div>
  )
}

/** Un cable: dos bornes y el hilo, entero o cortado al medio. */
function Cable({
  color,
  cortado,
  marca,
}: {
  color: Color
  cortado: boolean
  marca: "ok" | "mal" | "neutra"
}) {
  // El color entra por variables CSS para que el degradado del
  // brillo se arme en la hoja de estilos y no acá.
  const tono = {
    "--cable": HEX[color],
    "--brillo": HEX_BRILLO[color],
  } as CSSProperties

  return (
    <span className={styles.via} style={tono}>
      <span className={styles.borne} />
      {cortado ? (
        <>
          <span className={styles.hiloIzq} />
          <span
            className={[
              styles.marca,
              marca === "ok" ? styles.ok : marca === "mal" ? styles.mal : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-hidden="true"
          >
            ✕
          </span>
          <span className={styles.hiloDer} />
        </>
      ) : (
        <span className={styles.hilo} />
      )}
      <span className={styles.borne} />
    </span>
  )
}

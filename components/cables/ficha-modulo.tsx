import { conteos, HEX, paridad, type Modulo } from "@/lib/cables/motor"
import { Enfasis } from "./enfasis"
import styles from "./cables.module.css"

/** El número de cable a cortar, bien grande. */
export function Respuesta({ modulo }: { modulo: Modulo }) {
  return (
    <div className={styles.respuesta}>
      <div className={styles.respuestaNum}>{modulo.correcto + 1}</div>
      <div className={styles.respuestaPie}>
        cable a cortar — contando desde arriba, empezando en 1
      </div>
      <div className={styles.respuestaColor}>
        cable {modulo.colores[modulo.correcto]}
      </div>
    </div>
  )
}

/** Todo lo que hace falta para seguir el razonamiento a mano. */
export function DatosModulo({ modulo }: { modulo: Modulo }) {
  return (
    <>
      <dl className={styles.datos}>
        <dt>Código</dt>
        <dd>{modulo.id}</dd>
        <dt>Cantidad de cables</dt>
        <dd>{modulo.n}</dd>
        <dt>N.º de serie</dt>
        <dd>{modulo.serial}</dd>
        <dt>Último dígito</dt>
        <dd>
          {modulo.digito} ({paridad(modulo.digito)})
        </dd>
        <dt>Último cable</dt>
        <dd>{modulo.colores[modulo.n - 1]}</dd>
        <dt>Recuento</dt>
        <dd>
          <ul className={styles.leyenda}>
            {conteos(modulo.colores).map(({ color, cantidad }) => (
              <li
                key={color}
                className={cantidad === 0 ? styles.cero : undefined}
              >
                <span
                  className={styles.muestra}
                  style={{ background: HEX[color] }}
                />
                <span>
                  {color} ×{cantidad}
                </span>
              </li>
            ))}
          </ul>
        </dd>
      </dl>

      <p className={styles.rotulo} style={{ margin: "20px 0 0" }}>
        Orden de cables (de arriba hacia abajo)
      </p>
      <ul className={styles.listaCables}>
        {modulo.colores.map((color, i) => (
          <li
            key={i}
            className={i === modulo.correcto ? styles.esCorrecto : undefined}
          >
            <span className={styles.muestra} style={{ background: HEX[color] }} />
            <span>
              Cable {i + 1} — {color}
              {i === modulo.correcto ? "  ← cortar este" : ""}
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}

/**
 * Las reglas del grupo que corresponde, marcando cuál se aplicó y
 * tachando las que se descartaron. Es lo que le permite al profe
 * decir "se trabaron acá" en vez de solo cantar el número.
 */
export function TrazaReglas({ modulo }: { modulo: Modulo }) {
  return (
    <ol className={styles.traza}>
      {modulo.traza.map((paso, i) => (
        <li
          key={i}
          className={
            paso.estado === "aplica"
              ? styles.aplica
              : paso.estado === "descartada"
                ? styles.descartada
                : styles.noEvaluada
          }
        >
          <span>
            <Enfasis texto={paso.texto} />
          </span>
        </li>
      ))}
    </ol>
  )
}

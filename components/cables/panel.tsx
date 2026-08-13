import Link from "next/link"
import {
  CANTIDADES,
  idsDeLote,
  moduloDesdeId,
  type Modulo,
} from "@/lib/cables/motor"
import { rutas } from "@/lib/cables/rutas"
import { firmaDe, haySecreto } from "@/lib/cables/secreto"
import { BotonCopiar } from "./boton-copiar"
import { BotonImprimir } from "./boton-imprimir"
import styles from "./cables.module.css"

/**
 * El panel del docente: elige el código y reparte los enlaces.
 *
 * Componente de servidor. Antes era un componente cliente que
 * generaba los códigos con Math.random en el navegador; ahora tiene
 * que ser servidor porque el enlace de la hoja del profe lleva una
 * firma que solo se puede calcular con la clave. De paso, la tabla
 * de reglas dejó de viajar al navegador de nadie: los formularios
 * son GET comunes y el único JS es el botón de copiar.
 */
type Props = {
  clave: string
  modulo: Modulo
  /** Cantidad de cables elegida en el formulario, para no perderla. */
  cantidad: string
  lote: { id: string; grupos: number; cantidad: string } | null
}

export function Panel({ clave, modulo, cantidad, lote }: Props) {
  const accion = rutas.panel(clave)

  return (
    <>
      {!haySecreto() && <AvisoSinSecreto />}

      <section className={`${styles.panel} ${styles.sinImprimir}`}>
        <h2 className={styles.subtitulo}>1. Elegí el código del módulo</h2>

        <form method="get" action={accion} className={styles.controles}>
          <div className={styles.campo}>
            <label htmlFor="codigo">Código</label>
            <input
              id="codigo"
              name="codigo"
              type="text"
              maxLength={6}
              spellCheck={false}
              autoComplete="off"
              defaultValue={modulo.id}
            />
          </div>
          <div className={styles.campo}>
            <label htmlFor="n">Cantidad de cables</label>
            <select id="n" name="n" defaultValue={cantidad}>
              <option value="">cualquiera</option>
              {CANTIDADES.map((n) => (
                <option key={n} value={n}>
                  {n} cables
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={styles.boton}>
            Buscar código
          </button>
          <button
            type="submit"
            name="nuevo"
            value="1"
            className={`${styles.boton} ${styles.primario}`}
          >
            Generar código nuevo
          </button>
        </form>

        <p className={styles.parrafo}>
          Este código produce un módulo de <strong>{modulo.n} cables</strong>,
          serie <strong>{modulo.serial}</strong>. Siempre el mismo, en cualquier
          dispositivo.
        </p>
      </section>

      <Enlaces modulo={modulo} />

      <Lote modulo={modulo} lote={lote} accion={accion} />

      <div className={`${styles.pie} ${styles.sinImprimir}`}>
        <Link href={rutas.planilla()}>Ver la planilla de reglas</Link>
      </div>
    </>
  )
}

function AvisoSinSecreto() {
  return (
    <section className={styles.panel}>
      <p className={styles.aviso} style={{ marginTop: 0 }}>
        ⚠ No hay <code>CABLES_SECRETO</code> configurado. Las firmas de las
        hojas del profe se calculan con un valor por defecto, así que{" "}
        <b>cualquiera puede adivinarlas</b>. Definí la variable de entorno con
        una cadena larga (12 caracteres o más, solo letras, números y guiones)
        antes de usar esto con estudiantes.
      </p>
    </section>
  )
}

function Enlaces({ modulo }: { modulo: Modulo }) {
  // Las URLs se muestran relativas: el navegador ya sabe el origen y
  // el botón de copiar lo resuelve. Así el panel no depende de leer
  // la cabecera Host, que detrás de un proxy no siempre es la real.
  const vistas = [
    {
      titulo: "Desafío interactivo",
      para: "Para quien tiene el módulo en la mano. Ve los cables y el número de serie, y corta uno. No ve las reglas ni la respuesta.",
      ruta: rutas.desafio(modulo.id),
      nota: null,
    },
    {
      titulo: "Planilla de reglas",
      para: "Para quien lee el manual. Tiene las reglas de 3, 4, 5 y 6 cables, pero no ve el módulo. No depende del código: se imprime una vez y sirve para todo el taller.",
      ruta: rutas.planilla(),
      nota: null,
    },
    {
      titulo: "Hoja del profe",
      para: "Solo para quien coordina. Muestra el módulo, la respuesta y qué regla la produjo, paso a paso.",
      ruta: rutas.profe(modulo.id, firmaDe(modulo.id)),
      nota: "Los últimos 8 caracteres son la firma de este módulo. Sin ellos la página no abre, así que nadie llega acá cambiando “desafio” por “profe” en la URL.",
    },
  ]

  return (
    <section className={`${styles.panel} ${styles.sinImprimir}`}>
      <h2 className={styles.subtitulo}>2. Reparte los tres enlaces</h2>
      <p className={styles.parrafo} style={{ marginBottom: 16 }}>
        Código activo: <span className={styles.codigoGrande}>{modulo.id}</span>
      </p>
      <div className={styles.enlaces}>
        {vistas.map((vista) => (
          <article key={vista.titulo} className={styles.enlace}>
            <div className={styles.enlaceTitulo}>{vista.titulo}</div>
            <div className={styles.enlacePara}>{vista.para}</div>
            <code className={styles.enlaceUrl}>{vista.ruta}</code>
            <div className={styles.acciones} style={{ marginTop: 0 }}>
              <a
                className={`${styles.boton} ${styles.chico}`}
                href={vista.ruta}
                target="_blank"
                rel="noopener"
              >
                Abrir en pestaña nueva
              </a>
              <BotonCopiar texto={vista.ruta} />
            </div>
            {vista.nota && (
              <p className={styles.enlacePara} style={{ margin: "10px 0 0" }}>
                {vista.nota}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

function Lote({
  modulo,
  lote,
  accion,
}: {
  modulo: Modulo
  lote: Props["lote"]
  accion: string
}) {
  const filas = lote
    ? idsDeLote(
        lote.id,
        lote.grupos,
        lote.cantidad ? Number(lote.cantidad) : null
      ).map(moduloDesdeId)
    : null

  return (
    <section className={styles.panel}>
      <h2 className={`${styles.subtitulo} ${styles.sinImprimir}`}>
        3. ¿Varios grupos a la vez?
      </h2>
      <p className={`${styles.parrafo} ${styles.sinImprimir}`}>
        Un código por grupo. Cada grupo recibe un módulo distinto y la misma
        planilla de reglas, así no se pueden copiar la respuesta.
      </p>

      <form
        method="get"
        action={accion}
        className={`${styles.controles} ${styles.sinImprimir}`}
        style={{ marginTop: 14 }}
      >
        <input type="hidden" name="codigo" value={modulo.id} />
        <div className={styles.campo}>
          <label htmlFor="grupos">Grupos</label>
          <input
            id="grupos"
            name="grupos"
            type="number"
            min={1}
            max={30}
            defaultValue={lote?.grupos ?? 6}
          />
        </div>
        <div className={styles.campo}>
          <label htmlFor="nlote">Cantidad de cables</label>
          <select id="nlote" name="nlote" defaultValue={lote?.cantidad ?? ""}>
            <option value="">cualquiera</option>
            {CANTIDADES.map((n) => (
              <option key={n} value={n}>
                {n} cables
              </option>
            ))}
          </select>
        </div>
        <button type="submit" name="lote" value="1" className={styles.boton}>
          Generar lote
        </button>
        {lote && <BotonImprimir>Imprimir lote</BotonImprimir>}
      </form>

      {filas && (
        <>
          <p className={styles.aviso}>
            ⚠ Esta tabla incluye las respuestas. No la proyectes ni la dejes a
            la vista de quienes juegan.
          </p>
          <table className={styles.lote}>
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Código</th>
                <th>Cables</th>
                <th>Respuesta</th>
                <th className={styles.sinImprimir}>Enlaces</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((m, i) => (
                <tr key={m.id}>
                  <td>{i + 1}</td>
                  <td className={styles.cod}>{m.id}</td>
                  <td>{m.n}</td>
                  <td>
                    cable {m.correcto + 1} ({m.colores[m.correcto]})
                  </td>
                  <td className={styles.sinImprimir}>
                    <a
                      href={rutas.desafio(m.id)}
                      target="_blank"
                      rel="noopener"
                    >
                      desafío
                    </a>
                    <a
                      href={rutas.profe(m.id, firmaDe(m.id))}
                      target="_blank"
                      rel="noopener"
                    >
                      profe
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={`${styles.parrafo} ${styles.sinImprimir}`}>
            Este lote es estable: podés recargar la página o guardar el enlace y
            te salen los mismos códigos.
          </p>
        </>
      )}
    </section>
  )
}

import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { Panel } from "@/components/cables/panel"
import {
  CANTIDADES,
  generarIdCon,
  idValido,
  moduloDesdeId,
  normalizarId,
} from "@/lib/cables/motor"
import { rutas } from "@/lib/cables/rutas"
import { claveValida } from "@/lib/cables/secreto"
import styles from "@/components/cables/cables.module.css"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Panel del profe — Módulo de Cables",
  robots: { index: false, follow: false },
}

type Props = {
  params: Promise<{ clave: string }>
  searchParams: Promise<{
    codigo?: string
    n?: string
    nuevo?: string
    lote?: string
    grupos?: string
    nlote?: string
  }>
}

export default async function PanelPage({ params, searchParams }: Props) {
  const { clave: claveCruda } = await params
  const clave = decodeURIComponent(claveCruda)

  // Clave equivocada: 404 pelado, sin mensaje. Un "clave incorrecta"
  // le confirmaría a un estudiante que la ruta existe y que vale la
  // pena seguir probando.
  if (!claveValida(clave)) {
    notFound()
  }

  const q = await searchParams
  const cantidad = cantidadValida(q.n)
  const accion = rutas.panel(clave)

  // "Generar código nuevo" y la primera visita (sin código en la URL)
  // terminan en un redirect, para que la URL siempre refleje el
  // módulo que se está viendo y el docente pueda guardarla o
  // recargarla.
  const pedido = normalizarId(q.codigo)
  if (q.nuevo || (q.codigo === undefined && !idValido(pedido))) {
    const destino = rutas.panel(clave, {
      codigo: generarIdCon(cantidad ? Number(cantidad) : null),
      ...(cantidad ? { n: cantidad } : {}),
    })
    redirect(destino)
  }

  // Si tipeó un código a mano y no pasa el dígito de control, se lo
  // decimos en vez de reemplazarlo en silencio por uno al azar — eso
  // es indistinguible de "Generar código nuevo" y parece que el botón
  // de buscar no hace nada.
  if (!idValido(pedido)) {
    return (
      <div className={styles.wrap}>
        <header className={cn(styles.sinImprimir, "mb-6")}>
          <div className={styles.eyebrow}>Sala de escape — panel del profe</div>
          <h1 className={styles.titulo}>Módulo de Cables</h1>
        </header>

        <section className={styles.panel}>
          <p className={styles.aviso} style={{ marginTop: 0 }}>
            ⚠ “{q.codigo}” no es un código válido. Son 6 caracteres, sin las
            letras I ni O y sin los números 0 ni 1 — revisá si lo copiaste
            bien.
          </p>

          <form
            method="get"
            action={accion}
            className={styles.controles}
            style={{ marginTop: 14 }}
          >
            <div className={styles.campo}>
              <label htmlFor="codigo">Código</label>
              <input
                id="codigo"
                name="codigo"
                type="text"
                maxLength={6}
                spellCheck={false}
                autoComplete="off"
                defaultValue={q.codigo}
                autoFocus
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
        </section>
      </div>
    )
  }

  const modulo = moduloDesdeId(pedido)

  const grupos = Math.max(1, Math.min(30, Number(q.grupos) || 6))
  const lote = q.lote
    ? {
        id: `${pedido}:${grupos}:${q.nlote ?? ""}`,
        grupos,
        cantidad: cantidadValida(q.nlote),
      }
    : null

  return (
    <div className={styles.wrap}>
      <header className={cn(styles.sinImprimir, "mb-6")}>
        <div className={styles.eyebrow}>Sala de escape — panel del profe</div>
        <h1 className={styles.titulo}>Módulo de Cables</h1>
        <p className={styles.parrafo}>
          ¡Te damos la bienvenida al primer módulo de esta sala de escape!
        </p>
        <p className={styles.parrafo}>
          Como profe, podés generar módulos con distintos códigos y repartirlos
          entre los grupos.
        </p>
        <p className={styles.parrafo}>
          Un código genera un módulo completo: cuántos cables hay, de qué color,
          el número de serie y cuál es el cable correcto. Del mismo código salen
          tres enlaces distintos. Repartí los enlaces y la consigna se arma
          sola.
        </p>
        <p className={styles.parrafo}>
          La idea del juego:{" "}
          <strong>
            quien tiene el desafío no puede leer la planilla, y quien tiene la
            planilla no puede ver los cables
          </strong>
          . Para desactivar el módulo tienen que describirse las cosas en voz
          alta y ponerse de acuerdo.
        </p>
      </header>

      <Panel clave={clave} modulo={modulo} cantidad={cantidad} lote={lote} />

      <div className="mt-6 text-xs">
        Basado en el videojuego{" "}
        <a href="https://keeptalkinggame.com/" target="_blank">
          Keep talking and nobody explodes
        </a>
      </div>
    </div>
  )
}

/** "" si no es una de las cantidades que el motor sabe resolver. */
function cantidadValida(valor: string | undefined): string {
  return valor && CANTIDADES.includes(Number(valor)) ? valor : ""
}

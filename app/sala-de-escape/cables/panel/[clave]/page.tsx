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

  // "Generar código nuevo" y los códigos inválidos terminan en un
  // redirect, para que la URL siempre refleje el módulo que se está
  // viendo y el docente pueda guardarla o recargarla.
  const pedido = normalizarId(q.codigo)
  if (q.nuevo || !idValido(pedido)) {
    const destino = rutas.panel(clave, {
      codigo: generarIdCon(cantidad ? Number(cantidad) : null),
      ...(cantidad ? { n: cantidad } : {}),
    })
    redirect(destino)
  }

  const modulo = moduloDesdeId(pedido)

  const grupos = Math.max(1, Math.min(30, Number(q.grupos) || 6))
  const lote = q.lote
    ? { id: `${pedido}:${grupos}:${q.nlote ?? ""}`, grupos, cantidad: cantidadValida(q.nlote) }
    : null

  return (
    <div className={styles.wrap}>
      <header className={styles.sinImprimir}>
        <div className={styles.eyebrow}>
          Sala de escape — panel del profe
        </div>
        <h1 className={styles.titulo}>Módulo de Cables</h1>
        <p className={styles.parrafo}>
          Un código genera un módulo completo: cuántos cables hay, de qué
          color, el número de serie y cuál es el cable correcto. Del mismo
          código salen tres enlaces distintos. Reparte los enlaces y la
          consigna se arma sola.
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
    </div>
  )
}

/** "" si no es una de las cantidades que el motor sabe resolver. */
function cantidadValida(valor: string | undefined): string {
  return valor && CANTIDADES.includes(Number(valor)) ? valor : ""
}

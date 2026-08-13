"use client"

import { useState } from "react"
import styles from "./cables.module.css"

/** El único pedazo de JavaScript del panel. */
export function BotonCopiar({ texto }: { texto: string }) {
  const [estado, setEstado] = useState<"listo" | "copiado" | "falla">("listo")

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      setEstado("copiado")
    } catch {
      // Sin permiso de portapapeles (o sin HTTPS): que lo copie a mano.
      setEstado("falla")
    }
    setTimeout(() => setEstado("listo"), 1800)
  }

  return (
    <button
      type="button"
      className={`${styles.boton} ${styles.chico}`}
      onClick={copiar}
    >
      {estado === "copiado"
        ? "¡Copiado!"
        : estado === "falla"
          ? "Copialo a mano ↑"
          : "Copiar enlace"}
    </button>
  )
}

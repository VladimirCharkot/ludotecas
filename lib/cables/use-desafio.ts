"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { ModuloJugable } from "./motor"

/**
 * Estado de una partida sobre un módulo dado.
 *
 * El módulo es inmutable y se deriva del id; lo mutable —qué cables
 * están cortados, qué se cortó, cuántos intentos van— vive acá. En
 * la versión anterior las dos cosas estaban en el mismo objeto
 * global y el dibujo las leía por referencia; separarlas es lo que
 * permite que el tablero sea un componente sin efectos.
 */
export type Desafio = {
  cortes: boolean[]
  /** Índice del cable cortado, o null si la ronda sigue abierta. */
  resultado: number | null
  /** null mientras no se cortó nada. */
  acierto: boolean | null
  intentos: number
  cortar: (indice: number) => void
  reiniciar: () => void
}

export function useDesafio(modulo: ModuloJugable): Desafio {
  const [resultado, setResultado] = useState<number | null>(null)
  const [intentos, setIntentos] = useState(0)

  const cortes = useMemo(() => {
    const arr = new Array<boolean>(modulo.n).fill(false)
    if (resultado !== null) arr[resultado] = true
    return arr
  }, [modulo.n, resultado])

  const cortar = useCallback(
    (indice: number) => {
      if (indice < 0 || indice >= modulo.n) return
      if (resultado !== null) return // la ronda ya se jugó
      setResultado(indice)
      setIntentos((k) => k + 1)
      sonar(indice === modulo.correcto)
    },
    [modulo.n, modulo.correcto, resultado]
  )

  const reiniciar = useCallback(() => setResultado(null), [])

  // Teclas 1–6 para cortar, R para reintentar. En un proyector o
  // con el teclado de un aula es más rápido que apuntar con el mouse.
  useEffect(() => {
    function alTeclear(ev: KeyboardEvent) {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return
      if (resultado !== null) {
        if (ev.key === "r" || ev.key === "R") reiniciar()
        return
      }
      const num = Number(ev.key)
      if (Number.isInteger(num) && num >= 1 && num <= modulo.n) {
        ev.preventDefault()
        cortar(num - 1)
      }
    }
    document.addEventListener("keydown", alTeclear)
    return () => document.removeEventListener("keydown", alTeclear)
  }, [modulo.n, resultado, cortar, reiniciar])

  return {
    cortes,
    resultado,
    acierto: resultado === null ? null : resultado === modulo.correcto,
    intentos,
    cortar,
    reiniciar,
  }
}

/** Pitido de acierto o error. Si no hay audio, el juego sigue igual. */
function sonar(ok: boolean) {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Ctx) return

    const ctx = new Ctx()
    // Si el navegador lo creó suspendido (política de autoplay), esto
    // lo despierta en cuanto hubo un gesto real del usuario.
    if (ctx.state === "suspended") void ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = ok ? "sine" : "sawtooth"
    osc.frequency.value = ok ? 880 : 130
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + (ok ? 0.35 : 0.6)
    )
    osc.start()
    osc.stop(ctx.currentTime + (ok ? 0.4 : 0.65))
    setTimeout(() => void ctx.close(), 1200)
  } catch {
    /* sin audio disponible */
  }
}

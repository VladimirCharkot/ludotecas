import { Fragment } from "react"

/**
 * Renderiza el texto de una regla: lo que va *entre asteriscos*
 * sale en negrita.
 *
 * Las reglas viven en `lib/cables/motor.ts` como strings planos en
 * vez de HTML, así el mismo texto se puede usar en la planilla, en
 * la traza del profe y en un aria-label sin pasar por
 * dangerouslySetInnerHTML.
 */
export function Enfasis({ texto }: { texto: string }) {
  // Los índices impares son lo que estaba entre asteriscos.
  const partes = texto.split("*")
  return (
    <>
      {partes.map((parte, i) =>
        i % 2 === 1 ? (
          <b key={i}>{parte}</b>
        ) : (
          <Fragment key={i}>{parte}</Fragment>
        )
      )}
    </>
  )
}

/** El mismo texto sin marcas, para atributos y textos planos. */
export function sinMarcas(texto: string): string {
  return texto.replace(/\*/g, "")
}

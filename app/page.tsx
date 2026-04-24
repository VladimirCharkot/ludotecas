"use client"

import LinksPortada from "@/components/links-svg"

export default function Home() {
  return (
    <>
      <LinksPortada />
      <div className="max-w-lg mx-auto mb-8 text-center">
        <p className="font-barriecito mb-4">Contactos:</p>

        <p className="font-semibold">
          Línea Ludotecas y dispositivos lúdicos:{" "}
        </p>
        <pre>ludotecaseducacion.cba@gmail.com</pre>

        <p className="font-semibold mt-6">Línea Ajedrez educativo: </p>
        <pre>ajedrezeducativocba@gmail.com</pre>
      </div>
    </>
  )
}

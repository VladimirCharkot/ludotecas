import { cn } from "@/lib/utils"
import React from "react"
import Image, { StaticImageData } from "next/image"
import Link from "next/link"

interface CajitaProps {
  children?: React.ReactNode
  classNames?: {
    root?: string
    content?: string
    svg?: string
  }
}

interface CajitaColorProps extends CajitaProps {
  /** Color del cuerpo principal. Default: púrpura de marca */
  color?: string
  /** Color de la sombra. Default: gris claro */
  shadowColor?: string
}

// Paths extraídos del SVG original (cajita-biencba-digital.svg, viewBox 0 0 284 166)
const PATH_SHADOW =
  "M4.178,123.918c0.412,6.491 0.978,13.159 2.808,18.733c5.267,16.037 21.772,17.315 30.616,19.745c12.738,3.502 218.135,4.535 230.827,-0.167c2.677,-0.992 5.383,-2.458 7.549,-5.556c3.003,-4.295 4.607,-11.226 5.385,-18.135c2.382,-21.162 2.62,-44.288 1.502,-65.716c-0.961,-18.432 -2.051,-44.84 -9.532,-58.568c-2.82,-5.177 -6.506,-8.169 -10.311,-9.868c-2.821,-1.26 -5.728,-1.907 -8.611,-2.428c-15.281,-2.762 -224.291,-4.3 -238.683,7.44c-1.94,1.583 -3.75,3.801 -5.062,6.946c-1.417,3.399 -2.398,7.415 -3.143,11.47c-3.518,19.167 -4.721,40.048 -4.621,60.762c0.056,11.956 0.547,23.858 1.276,35.342"
const PATH_MAIN =
  "M1.282,118.649c0.412,6.154 0.978,12.474 2.808,17.758c5.267,15.203 21.772,16.414 30.616,18.719c12.738,3.318 218.135,4.297 230.827,-0.16c2.677,-0.94 5.383,-2.33 7.549,-5.267c3.003,-4.071 4.607,-10.641 5.385,-17.191c2.382,-20.06 2.62,-41.983 1.502,-62.296c-0.961,-17.474 -2.051,-42.508 -9.532,-55.52c-2.82,-4.908 -6.506,-7.744 -10.311,-9.355c-2.821,-1.195 -5.728,-1.808 -8.611,-2.302c-15.281,-2.617 -224.291,-4.075 -238.683,7.053c-1.94,1.5 -3.75,3.604 -5.062,6.585c-1.417,3.222 -2.398,7.029 -3.143,10.873c-3.518,18.17 -4.721,37.964 -4.621,57.599c0.056,11.336 0.547,22.618 1.276,33.504"

/**
 * Cajita — variante con SVG inline.
 *
 * Usa los paths originales del diseño. El SVG se estira con la div gracias a
 * preserveAspectRatio="none". Acepta color y shadowColor como props.
 */
export function Cajita({
  children,
  classNames = {},
  color = "#ab487e",
  shadowColor = "#e6e7e8",
}: CajitaColorProps) {
  return (
    <div className={cn("relative", classNames.root)}>
      {/* Fondo svg */}
      <svg
        className={cn("absolute inset-0 w-full h-full", classNames.svg)}
        viewBox="0 0 284 166"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ fillRule: "evenodd", clipRule: "evenodd" }}
      >
        <path d={PATH_SHADOW} fill={shadowColor} fillRule="nonzero" />
        <path d={PATH_MAIN} fill={color} fillRule="nonzero" />
      </svg>

      {/* Contenido */}
      <div className={cn("relative", classNames.content)}>{children}</div>
    </div>
  )
}

export function CajitaLink({
  img,
  alt,
  titulo,
  descripcion,
  url,
  external = false,
}: {
  img: StaticImageData
  alt: string
  titulo: string
  descripcion: string
  url: string
  external?: boolean
}) {
  return (
    <Link href={url} target={external ? "_blank" : undefined}>
      <Cajita classNames={{ root: "mx-auto w-[85%] md:w-lg py-4" }}>
        <div className="flex gap-6 items-center pb-2 group cursor-pointer">
          <Image
            src={img}
            className="w-24 h-24 object-contain transition-transform scale-120 rotate-0 group-hover:-rotate-6"
            alt={alt}
            width={128}
            height={128}
          />
          <div className="flex flex-col pr-8">
            <span className="text-2xl font-barriecito font-bold text-white group-hover:text-shadow-[2px_2px_#333]">
              {titulo}
            </span>
            <span className="text-sm text-gray-100">{descripcion}</span>
          </div>
        </div>
      </Cajita>
    </Link>
  )
}

import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import React from "react"

interface GlobitoProps {
  children?: React.ReactNode
  classNames?: {
    root?: string
    content?: string
    svg?: string
  }
}

interface GlobitoColorProps extends GlobitoProps {
  /** Color del cuerpo principal. Default: azul de marca */
  color?: string
  /** Color de la sombra. Default: gris claro */
  shadowColor?: string
}

// Paths extraídos del SVG original (globito-biencba-digital.svg, viewBox 0 0 443 242)
const PATH_SHADOW =
  "M6.516,166.41c0.643,8.717 1.525,17.672 4.379,25.156c8.213,21.538 33.946,23.253 47.737,26.517c19.861,4.702 340.125,6.088 359.915,-0.225c4.174,-1.332 8.394,-3.3 11.771,-7.461c4.683,-5.768 7.182,-15.075 8.396,-24.354c3.712,-28.418 4.085,-59.474 2.342,-88.25c-1.498,-24.753 -3.199,-60.217 -14.862,-78.651c-4.399,-6.952 -10.145,-10.97 -16.078,-13.252c-4.399,-1.692 -8.933,-2.561 -13.428,-3.261c-23.824,-3.708 -349.722,-5.773 -372.162,9.992c-3.025,2.124 -5.848,5.105 -7.893,9.327c-2.211,4.565 -3.741,9.958 -4.901,15.405c-5.485,25.739 -7.361,53.78 -7.207,81.595c0.089,16.057 0.854,32.041 1.991,47.462"
const PATH_MAIN =
  "M2,159.334c0.643,8.264 1.525,16.752 4.379,23.847c3.795,9.435 11.333,14.858 19.705,18.266c-0.261,10.545 0.255,40.274 0.255,40.274l27.777,-33.402c-0,-0 340.125,5.77 359.915,-0.214c4.174,-1.263 8.394,-3.13 11.771,-7.074c4.682,-5.467 7.182,-14.29 8.396,-23.086c3.712,-26.939 4.085,-56.379 2.342,-83.658c-1.498,-23.464 -3.199,-57.083 -14.862,-74.558c-4.399,-6.591 -10.145,-10.398 -16.078,-12.562c-4.399,-1.605 -8.932,-2.428 -13.428,-3.091c-23.824,-3.516 -349.722,-5.473 -372.162,9.471c-3.025,2.015 -5.848,4.841 -7.893,8.842c-2.211,4.328 -3.741,9.441 -4.901,14.602c-5.485,24.402 -7.361,50.983 -7.207,77.351c0.089,15.221 0.854,30.373 1.991,44.992"

/**
 * Globito — variante con SVG inline.
 *
 * Usa los paths originales del diseño. El SVG se estira con la div gracias a
 * preserveAspectRatio="none". Acepta color y shadowColor como props.
 */
export function Globito({
  children,
  classNames = {},
  color = "#1188c6",
  shadowColor = "#e6e7e8",
}: GlobitoColorProps) {
  return (
    <div className={cn("relative min-h-[5em]", classNames.root)}>
      {/* Fondo svg */}
      <svg
        className={cn("absolute inset-0 w-full h-full", classNames.svg)}
        viewBox="0 0 443 242"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ fillRule: "evenodd", clipRule: "evenodd" }}
      >
        <path d={PATH_SHADOW} fill={shadowColor} fillRule="nonzero" />
        <path d={PATH_MAIN} fill={color} fillRule="nonzero" />
      </svg>

      {/* Contenido */}
      <div className={cn("relative pb-6", classNames.content)}>{children}</div>
    </div>
  )
}

export function GlobitoLink({
  img,
  alt,
  titulo,
  descripcion,
  url,
  external = false,
}: {
  img?: string
  alt: string
  titulo: string
  descripcion: string
  url: string
  external?: boolean
}) {
  return (
    <Link href={url} target={external ? "_blank" : undefined}>
      <Globito classNames={{ root: "mx-auto w-[85%] md:w-lg py-4" }}>
        <div className="flex gap-6 items-center pb-2 group cursor-pointer">
          {img && (
            <Image
              src={img}
              className="w-24 h-24 object-contain transition-transform scale-120 rotate-0 group-hover:-rotate-6"
              alt={alt}
              width={128}
              height={128}
            />
          )}
          <div className="flex flex-col pr-8">
            <span className="text-2xl mx-4 mb-2 font-barriecito font-bold text-white group-hover:text-shadow-[2px_2px_#333]">
              {titulo}
            </span>
            <span className="pl-4 text-sm text-gray-100">{descripcion}</span>
          </div>
        </div>
      </Globito>
    </Link>
  )
}

"use client"

import { Stack } from "@mantine/core"
import { ComponentProps } from "react"
import { CajitaLink } from "./cajita"

import PinMapa from "@/public/assets/pin-mapa-rojo.svg"
import Videojuegos from "@/public/assets/pacman.webp"
import SalaDeEscape from "@/public/assets/escape-room.webp"
import Go from "@/public/assets/go-lazo/go-lazo-logo.webp"
import MiniaturaCartas from "@/public/assets/miniatura-cartas.webp"
import MiniaturaHechizo from "@/public/assets/hechizo.webp"
import Peon from "@/public/assets/peon.webp"
import PiezasJigsaw from "@/public/assets/piezas-jigsaw.webp"
import Logo from "@/public/logo.png"
import LogoProvincia from "@/public/assets/institucional/logo-provincia.webp"

const links: ComponentProps<typeof CajitaLink>[] = [
  {
    titulo: "Relevamiento de Ludotecas Escolares",
    url: "/relevamiento",
    img: PinMapa,
    alt: "Flyer del relevamiento de ludotecas escolares",
    descripcion:
      "Completá el formulario y navegá el mapa con las ludotecas que ya se sumaron a la red.",
  },
  {
    titulo: "Línea Videojuegos del Programa",
    url: "/videojuegos",
    img: Videojuegos,
    alt: "Ícono de Pacman.",
    descripcion:
      "Capacitaciones en programación y diseño de videojuegos para docentes y estudiantes, desde una perspectiva de derecho al juego.",
  },
  {
    titulo: "Sala de Escape: Módulo de Cables",
    url: "/sala-de-escape",
    img: SalaDeEscape,
    alt: "Ícono de puerta de sala de escape.",
    descripcion:
      "Un juego de comunicación y trabajo en equipo para el aula: desactivá el módulo cortando el cable correcto.",
  },
  // {
  //   titulo: "Go-lazo",
  //   url: "/go-lazo",
  //   img: Go,
  //   alt: "Piedras de Go sobre el tablero.",
  //   descripcion: "El Go escolar aterriza en Córdoba!",
  // },
  {
    titulo: "Cómo armar una Ludoteca en tu escuela",
    url: "/guia-2026",
    img: MiniaturaHechizo,
    alt: "Miniatura del tríptico de hechizo ludotecario.",
    descripcion: "Pequeño recetario para armar una Ludoteca en tu escuela.",
  },
  {
    titulo: "Marco teórico",
    url: "https://drive.google.com/file/d/1hv0nVWmp5prA7Izu1ZP_FtX0I3cDwngC/view?usp=sharing",
    img: Logo,
    alt: "Logo Ludotecas",
    descripcion:
      "Documento que reúne los fundamentos teóricos de la línea de Ludotecas y dispositivos lúdicos del programa.",
  },
  {
    titulo: "Ludoteca digital",
    url: "/ludoteca",
    img: PiezasJigsaw,
    alt: "Piezas de rompecabezas de tres colores.",
    descripcion:
      "Accedé a nuestra colección de juegos para descargar, imprimir o construir.",
  },
  {
    titulo: "Ajedrez",
    url: "/ajedrez",
    img: Peon,
    alt: "Peón de ajedrez.",
    descripcion:
      "Documentos, información y recursos de la línea de Ajedrez dentro del programa.",
  },
  {
    titulo: "Naipes - 50 años 50 juegos",
    url: "/ludoteca/50-cartas",
    img: MiniaturaCartas,
    alt: "Miniatura del reverso de las cartas.",
    descripcion:
      "En el marco del 50 aniversario del golpe cívico-militar presentamos 50 naipes para encontrarnos jugando.",
  },
  {
    titulo: "Institucional - Ludotecas, Ajedrez y Go",
    url: "http://www.igualdadycalidadcba.gov.ar/SIPEC-CBA/SFI/DGBE/SPDyC/ludotecas.php",
    external: true,
    img: LogoProvincia,
    alt: "Logo Ludotecas",
    descripcion:
      "Link directo a nuestra página dentro del sitio institucional de la Secretaría de Fortalecimiento Institucional y Educación Superior.",
  },
]

export default function LinksPortada() {
  return (
    <Stack align="stretch" className="max-w-lg" mb="40px" mx="auto" mt="xl">
      {links.map((link) => (
        <CajitaLink {...link} key={link.url} />
      ))}
    </Stack>
  )
}

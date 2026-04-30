"use client"

import { Stack } from "@mantine/core"
import { ComponentProps } from "react"
import { CajitaLink } from "./cajita"

import MiniaturaCartas from "@/public/assets/miniatura-cartas.webp"
import MiniaturaHechizo from "@/public/assets/miniatura-hechizo.webp"
import PiezasJigsaw from "@/public/assets/piezas-jigsaw.webp"
import Peon from "@/public/assets/peon.webp"
import Logo from "@/public/logo.png"

const links: ComponentProps<typeof CajitaLink>[] = [
  {
    titulo: "Cómo armar una Ludoteca en tu escuela",
    url: "https://drive.google.com/file/d/1P7042YlGUzAZR6TygjvauxskGnXN25-t/view",
    external: true,
    img: MiniaturaHechizo,
    alt: "Miniatura del tríptico de hechizo ludotecario.",
    descripcion: "Pequeño recetario para armar una Ludoteca en tu escuela.",
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
    img: Logo,
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

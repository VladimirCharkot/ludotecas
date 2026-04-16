"use client"

import { Stack } from "@mantine/core"
import { ComponentProps } from "react"
import { CajitaLink } from "./cajita"

import MiniaturaCartas from "@/public/assets/miniatura-cartas.png"
import MiniaturaHechizo from "@/public/assets/miniatura-hechizo.png"
import Logo from "@/public/logo.png"

const links: ComponentProps<typeof CajitaLink>[] = [
  {
    titulo: "Naipes - 50 años 50 juegos",
    url: "https://drive.google.com/file/d/1tq13MKJxEa7uF4GJ2J0mRPnqiBtj95jl/view?usp=sharing",
    img: MiniaturaCartas,
    alt: "Miniatura del reverso de las cartas.",
    descripcion:
      "En el marco del 50 aniversario del golpe cívico-militar presentamos 50 naipes para encontrarnos jugando.",
  },
  // {
  //   titulo: "Videojuegos 50 naipes",
  //   link: "https://docs.google.com/document/d/1dcU0J_cHolHb7EOvM2mabx0pfqff1Z4owqzyUPsfd7o/",
  // },
  {
    titulo: "Cómo armar una Ludoteca en tu escuela",
    url: "https://drive.google.com/file/d/1gnQkeK2W0SrVixmaoL1R338hAbHlAKXc/",
    img: MiniaturaHechizo,
    alt: "Miniatura del tríptico de hechizo ludotecario.",
    descripcion: "Pequeño recetario para armar una Ludoteca en tu escuela.",
  },
  {
    titulo: "Institucional - Ludotecas, Ajedrez y Go",
    url: "http://www.igualdadycalidadcba.gov.ar/SIPEC-CBA/SFI/DGBE/SPDyC/ludotecas.php",
    img: Logo,
    alt: "Logo Ludotecas",
    descripcion:
      "Link directo a nuestra página dentro del sitio institucional de la Secretaría de Fortalecimiento Institucional y Educación Superior.",
  },
]

export default function LinksPortada() {
  return (
    <Stack align="stretch" className="max-w-lg" mx="auto" mt="xl">
      {links.map((link) => (
        <CajitaLink {...link} key={link.url} />
      ))}
    </Stack>
  )
}

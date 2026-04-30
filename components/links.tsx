"use client"

import { Stack, Button, Grid, Image } from "@mantine/core"
import Link from "next/link"

const links = [
  {
    label: "Cómo armar una Ludoteca en tu escuela",
    url: "https://drive.google.com/file/d/1P7042YlGUzAZR6TygjvauxskGnXN25-t/view",
    descripcion: "Pequeño recetario para armar una Ludoteca en tu escuela.",
    imagen: "/assets/miniatura-hechizo.webp",
  },
  {
    label: "Ludoteca digital",
    url: "/ludoteca",
    descripcion:
      "Accedé a nuestra colección de juegos para descargar, imprimir o construir.",
    imagen: "/assets/piezas-jigsaw.webp",
  },
  {
    label: "Ajedrez",
    url: "/ajedrez",
    descripcion:
      "Documentos, información y recursos de la línea de Ajedrez dentro del programa.",
    imagen: "/assets/peon.webp",
  },
  {
    label: "Naipes - 50 años 50 juegos",
    url: "/ludoteca/50-cartas",
    descripcion:
      "En el marco del 50 aniversario del golpe cívico-militar presentamos 50 naipes para encontrarnos jugando.",
    imagen: "/assets/miniatura-cartas.webp",
  },
  {
    label: "Institucional - Ludotecas, Ajedrez y Go",
    url: "http://www.igualdadycalidadcba.gov.ar/SIPEC-CBA/SFI/DGBE/SPDyC/ludotecas.php",
    descripcion:
      "Link directo a nuestra página dentro del sitio institucional de la Secretaría de Fortalecimiento Institucional y Educación Superior.",
    imagen: "/logo.png",
  },
]

export default function LinksPortada() {
  return (
    <Stack align="stretch" className="max-w-4xl" mx="auto" mt="xl">
      <div className="m-10">
        {links.map((link) => (
          <HomeLink key={link.url} {...link} />
        ))}
      </div>
    </Stack>
  )
}

const HomeLink = (link: (typeof links)[number]) => (
  <div className="relative mb-10">
    <Button
      key={link.label}
      component={Link}
      href={link.url}
      color="blue"
      radius="50px 70px 50px 90px / 50px 50px 60px 80px"
      fullWidth
      justify="space-between"
      rightSection="→"
      className="hover:translate-x-1 transition-transform font-barriecito mb-2"
      styles={{
        root: {
          "--button-height": "auto",
          overflow: "visible",
          paddingTop: "10px",
          paddingBottom: "10px",
        },
        label: {
          fontSize: "1.8rem",
          whiteSpace: "normal", // Force the inner text to wrap
          textAlign: "left", // Keep it flush left when it breaks to line 2
          color: "white",
        },
      }}
    >
      <div className="flex gap-4 items-center justify-between">
        <div className="absolute w-32 flex justify-center">
          <Image
            className=""
            radius="md"
            h={110}
            w="auto"
            alt=""
            src={`${link.imagen}`}
          />
        </div>
        <div className="flex flex-col gap-2 pl-32">
          {link.label}
          <p className="text-xs text-white rounded-card px-2 font-bold font-poppins mb-2">
            {link.descripcion}
          </p>
        </div>
      </div>
    </Button>
  </div>
)

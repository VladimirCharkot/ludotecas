"use client"

import { Stack, Button, Grid, Image } from "@mantine/core"
import Link from "next/link"

const links = [
  {
    label: "Naipes - 50 años 50 juegos",
    url: "https://drive.google.com/file/d/1tq13MKJxEa7uF4GJ2J0mRPnqiBtj95jl/view?usp=sharing",
    descripcion:
      "Conoce el mazo de naipes con propuestas lúdicas que hemos creado para la conmemoración de los 50 años del golpe cívico-militar en Argentina",
    imagen: "/LogoCartas.png",
  },
  {
    label: "Videojuegos 50 naipes",
    url: "https://docs.google.com/document/d/1dcU0J_cHolHb7EOvM2mabx0pfqff1Z4owqzyUPsfd7o/",
    descripcion:
      "Conoce los videojuegos que hemos propuesto en nuestro mazo de cartas",
    imagen: "/Videojuegos.png",
  },
  // {
  //   label: "Propuestas Lúdicas",
  //   url: "https://drive.google.com/drive/folders/1oJf1eOwoM2PaCLHnKvvYeEqo0_s6kZN8?usp=drive_link",
  // },
  // {
  //   label: "Juegos Imprimibles",
  //   url: "https://drive.google.com/drive/u/0/folders/1fXlJL3HtIiSdcIMYpyWa3UxKQCE9ZMTA",
  // },
  {
    label: "Cómo armar una Ludoteca en tu escuela",
    url: "https://drive.google.com/file/d/1gnQkeK2W0SrVixmaoL1R338hAbHlAKXc/",
    descripcion:
      "Hechizo Ludotecario para que tu comunidad pueda realizar su propia Ludoteca",
    imagen: "/LogoCartas.png",
  },
  {
    label: "Institucional - Ludotecas, Ajedrez y Go",
    url: "http://www.igualdadycalidadcba.gov.ar/SIPEC-CBA/SFI/DGBE/SPDyC/ludotecas.php",
    descripcion:
      "Conoce el espacio institucional del Programad de Ludotecas, Ajedrez y Go",
    imagen: "/LogoFondo.png",
  },
]

export default function LinksPortada() {
  return (
    <Stack align="stretch" className="max-w-4xl" mx="auto" mt="xl">
      <div className="h-20 m-10">
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
        <div className="absolute">
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

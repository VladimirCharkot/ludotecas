"use client"

import { Stack, Button } from "@mantine/core"
import Link from "next/link"

const links = [
  {
    label: "Naipes - 50 años 50 juegos",
    url: "https://drive.google.com/file/d/1tq13MKJxEa7uF4GJ2J0mRPnqiBtj95jl/view?usp=sharing",
  },
  {
    label: "Videojuegos 50 naipes",
    url: "https://docs.google.com/document/d/1dcU0J_cHolHb7EOvM2mabx0pfqff1Z4owqzyUPsfd7o/",
  },
  {
    label: "Propuestas Lúdicas",
    url: "https://drive.google.com/drive/folders/1oJf1eOwoM2PaCLHnKvvYeEqo0_s6kZN8?usp=drive_link",
  },
  {
    label: "Juegos Imprimibles",
    url: "https://drive.google.com/drive/u/0/folders/1fXlJL3HtIiSdcIMYpyWa3UxKQCE9ZMTA",
  },
  {
    label: "Cómo armar una Ludoteca en tu escuela",
    url: "https://drive.google.com/file/d/1gnQkeK2W0SrVixmaoL1R338hAbHlAKXc/",
  },
  {
    label: "Institucional - Ludotecas, Ajedrez y Go",
    url: "http://www.igualdadycalidadcba.gov.ar/SIPEC-CBA/SFI/DGBE/SPDyC/ludotecas.php",
  },
]

export default function LinksPortada() {
  return (
    <Stack align="stretch" className="max-w-lg" mx="auto" mt="xl">
      {links.map((link) => (
        <HomeLink {...link} key={link.url} />
      ))}
    </Stack>
  )
}

const HomeLink = (link: (typeof links)[number]) => (
  <Button
    key={link.label}
    component={Link}
    href={link.url}
    variant="light"
    color="var(--color-brand-azul)"
    size="xl"
    radius="md"
    fullWidth
    justify="space-between"
    rightSection="→"
    className="hover:translate-x-1 transition-transform font-barriecito"
    styles={{
      label: {
        whiteSpace: "normal", // Force the inner text to wrap
        textAlign: "left", // Keep it flush left when it breaks to line 2
      },
    }}
  >
    {link.label}
  </Button>
)

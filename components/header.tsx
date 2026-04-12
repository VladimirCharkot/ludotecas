import { Box, Center, Group, Stack, Title } from "@mantine/core"
import Image from "next/image"
import { LogoBienCba } from "./reparticiones"
import LogoLudotecas from "@/public/logo.png"
import Link from "next/link"

export default function Header() {
  return (
    <Box
      component="header"
      bg="var(--fondo)"
      style={{ borderBottom: "1px solid var(--color-brand-rojo)" }}
      p="lg"
    >
      <Center>
        <Group wrap="nowrap">
          <Link href="/" className="flex items-center gap-4">
            <Image
              src={LogoLudotecas}
              width={256}
              height={256}
              className="h-16 md:h-24 w-16 md:w-24"
              alt="Logo Ludotecas, Ajedrez y Go"
            />
            <Stack gap={2} py={16}>
              <span className="font-semibold text-[0.9rem] md:text-[1.8rem] text-gray-600 uppercase">
                PROGRAMA
              </span>
              <Title className="text-[1.5rem] md:text-[2.5rem] " order={1}>
                Ludotecas, Ajedrez y Go
              </Title>
            </Stack>
          </Link>
          <LogoBienCba variante="texto-azul" className="w-12 hidden md:block" />
        </Group>
      </Center>
    </Box>
  )
}

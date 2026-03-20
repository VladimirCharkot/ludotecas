"use client"

import LinksPortada from "@/components/links"
import {
  LogoBienCba,
  LogoDireccion,
  LogoMinisterio,
  LogoProvincia,
  LogoSecretaria,
  LogoSubdireccion,
} from "@/components/reparticiones"
import Logo from "@/public/logo.png"
import Separador from "@/public/separador.png"
import { Box, Center, Flex, Group, Stack, Text, Title } from "@mantine/core"
import Image from "next/image"

export default function Home() {
  return (
    <Flex direction="column" mih="100vh">
      {/* --- HEADER --- */}
      <Box
        component="header"
        bg="var(--fondo)"
        style={{ borderBottom: "1px solid var(--color-brand-rojo)" }}
        p="lg"
      >
        <Center>
          <Group wrap="nowrap">
            <Image
              src={Logo}
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
            <LogoBienCba
              variante="texto-azul"
              className="w-12 hidden md:block"
            />
          </Group>
        </Center>
      </Box>

      {/* --- MAIN CONTENT --- */}
      {/* flex={1} is the key here. It forces this container to grow and push the footer down. */}
      <Box component="main" flex={1} p="md" py="xl">
        <LinksPortada />
      </Box>

      {/* --- FOOTER --- */}
      <Box
        component="footer"
        bg="var(--color-brand-azul)"
        c="white"
        className="relative mt-8"
      >
        {/* Separator Area */}
        <Box className="relative">
          <Image
            src={Separador}
            alt="Separador"
            className="absolute bottom-full left-0 w-full translate-y-2"
          />
        </Box>

        {/* Logos Area */}
        <Box p="lg">
          <Center>
            <Flex
              direction={{ base: "column", sm: "row" }}
              gap={{ base: "1em", sm: "2em" }}
              justify="space-between"
              align={{ base: "start", sm: "flex-end" }}
            >
              <LogoSubdireccion />
              <div className="flex flex-nowrap justify-between w-full md:w-max">
                <LogoDireccion />{" "}
                <LogoBienCba
                  variante="texto-blanco"
                  className="block md:hidden w-8"
                />
              </div>
              <LogoSecretaria />
              <LogoMinisterio />
              <LogoProvincia />
            </Flex>
          </Center>
        </Box>
      </Box>
    </Flex>
  )
}

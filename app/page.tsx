"use client"

import LinksPortada from "@/components/links"
import {
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
              <Text fw={700} fz={{ base: "0.9rem", sm: "1.2rem" }} c="dimmed">
                PROGRAMA
              </Text>
              <Title
                fz={{ base: "1.5rem", sm: "2.5rem" }}
                lh={{ base: 1.0, sm: 1.5 }}
                order={1}
              >
                Ludotecas, Ajedrez y Go
              </Title>
            </Stack>
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
              gap="md"
              justify="space-between"
              align={{ base: "start", sm: "flex-end" }}
            >
              <LogoSubdireccion />
              <LogoDireccion />
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

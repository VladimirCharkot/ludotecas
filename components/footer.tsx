import { Box, Center, Flex } from "@mantine/core"
import Image from "next/image"
import {
  LogoSubdireccion,
  LogoDireccion,
  LogoBienCba,
  LogoSecretaria,
  LogoMinisterio,
  LogoProvincia,
} from "./reparticiones"
import Separador from "@/public/assets/institucional/separador.webp"

export default function Footer() {
  return (
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
  )
}

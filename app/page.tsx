import {
  AppShell,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
  Center,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core"
import Image from "next/image"
import Logo from "@/public/logo.png"

export default function Home() {
  return (
    <AppShell header={{ height: 100 }} footer={{ height: 60 }} padding="md">
      <AppShellHeader
        bg="var(--fondo)"
        style={{ borderBottom: "1px solid var(--color-brand-rojo)" }}
      >
        <Center>
          <Group>
            <Image
              src={Logo}
              width={256}
              height={256}
              className="h-24 w-24"
              alt="Logo Ludotecas, Ajedrez y Go"
            />
            <Stack gap={2} py={16}>
              <Text fw={700} size="1.2rem" c="dimmed">
                PROGRAMA
              </Text>
              <Title order={1}>Ludotecas, Ajedrez y Go</Title>
            </Stack>
          </Group>
        </Center>
      </AppShellHeader>

      <AppShellMain>
        {/* Your content here */}
        <Text>Contenido principal</Text>
      </AppShellMain>

      <AppShellFooter p="md" bg="var(--color-brand-azul)" c="white">
        <Text size="sm" ta="center">
          Ministerio de Educación de la Provincia de Córdoba
        </Text>
      </AppShellFooter>
    </AppShell>
  )
}

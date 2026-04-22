import { getAllContent } from "@/lib/content"
import type { JuegoMeta } from "@/lib/content"
import JuegosIndex from "@/components/ludoteca/juegos-index"
import { Stack, Title } from "@mantine/core"

export default function LudotecaPage() {
  const juegos = getAllContent<JuegoMeta>("ludoteca").filter(
    (j) => !j.meta.oculto
  )

  return (
    <Stack p="xl" maw={1100} mx="auto" gap="lg">
      <Title order={2}>Ludoteca Digital</Title>
      <JuegosIndex juegos={juegos} />
    </Stack>
  )
}

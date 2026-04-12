import type { JuegoMeta } from "@/lib/content"
import { getRenderedBySlug } from "@/lib/content"
import { Badge, Group, Stack, Text, Title } from "@mantine/core"
import { Clock, Users } from "lucide-react"
import { redirect } from "next/navigation"

export default async function JuegoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const slug = (await params).slug
  const md = await getRenderedBySlug<JuegoMeta>("ludoteca", slug)

  if (!md) {
    return redirect("/ludoteca")
  }

  const { meta } = md

  return (
    <article className="max-w-185 mx-auto px-6 py-10">
      {/* Imagen hero */}
      {meta.imagen && (
        <div className="relative w-full h-64 rounded-xl overflow-hidden mb-8">
          <img src={meta.imagen} alt={meta.titulo} className="object-cover" />
        </div>
      )}

      {/* Encabezado */}
      <Stack gap="sm" mb="xl">
        <Title
          order={1}
          style={{ fontFamily: "var(--font-barrio)", fontWeight: 400 }}
        >
          {meta.titulo}
        </Title>

        {meta.descripcion && (
          <Text size="lg" c="dimmed" style={{ lineHeight: 1.5 }}>
            {meta.descripcion}
          </Text>
        )}

        {(meta.jugadores || meta.duracion || meta.edadMinima) && (
          <Group gap="lg" mt={4}>
            {meta.jugadores && (
              <Group gap={6}>
                <Users size={15} />
                <Text size="sm">{meta.jugadores} jugadores</Text>
              </Group>
            )}
            {meta.duracion && (
              <Group gap={6}>
                <Clock size={15} />
                <Text size="sm">{meta.duracion}</Text>
              </Group>
            )}
            {meta.edadMinima && (
              <Text size="sm" c="dimmed">
                {meta.edadMinima}+ años
              </Text>
            )}
          </Group>
        )}

        {meta.tags && meta.tags.length > 0 && (
          <Group gap={6}>
            {meta.tags.map((tag) => (
              <Badge key={tag} variant="light" size="sm">
                {tag}
              </Badge>
            ))}
          </Group>
        )}
      </Stack>

      {/* Cuerpo en markdown */}
      <div dangerouslySetInnerHTML={{ __html: md.html }} className="prose" />
    </article>
  )
}

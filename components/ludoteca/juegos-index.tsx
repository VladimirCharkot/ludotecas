"use client"

import type { ContentItem, JuegoMeta } from "@/lib/content"
import {
  Badge,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core"
import Fuse from "fuse.js"
import { Search, Tag } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"

interface Props {
  juegos: ContentItem<JuegoMeta>[]
}

export default function JuegosIndex({ juegos }: Props) {
  const [query, setQuery] = useState("")
  const [activeTags, setActiveTags] = useState<string[]>([])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    juegos.forEach((j) => j.meta.tags?.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [juegos])

  const fuse = useMemo(
    () =>
      new Fuse(juegos, {
        keys: [
          { name: "meta.titulo", weight: 3 },
          { name: "meta.tags", weight: 1.5 },
          { name: "meta.descripcion", weight: 1 },
        ],
        threshold: 0.3,
        ignoreLocation: true,
        ignoreDiacritics: true,
      }),
    [juegos]
  )

  const filtered = useMemo(() => {
    const q = query.trim()
    const results = q ? fuse.search(q).map((r) => r.item) : juegos
    return results.filter(
      (j) =>
        activeTags.length === 0 ||
        activeTags.every((t) => j.meta.tags?.includes(t))
    )
  }, [fuse, juegos, query, activeTags])

  function toggleTag(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  return (
    <Stack gap="lg">
      {/* Buscador */}
      <TextInput
        placeholder="Buscar juego..."
        leftSection={<Search size={16} />}
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        size="md"
      />

      {/* Selector de tags */}
      {allTags.length > 0 && (
        <Group gap="xs">
          {allTags.map((tag) => {
            const active = activeTags.includes(tag)
            return (
              <Badge
                key={tag}
                variant={active ? "filled" : "outline"}
                style={{ cursor: "pointer", userSelect: "none" }}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            )
          })}
          {activeTags.length > 0 && (
            <Badge
              variant="dot"
              color="red"
              style={{ cursor: "pointer", userSelect: "none" }}
              onClick={() => setActiveTags([])}
            >
              Limpiar filtros
            </Badge>
          )}
        </Group>
      )}

      {/* Resultados */}
      {filtered.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No se encontraron juegos con esos criterios.
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {filtered.map((juego) => (
            <Card
              key={juego.slug}
              component={Link}
              href={`/ludoteca/${juego.slug}`}
              withBorder
              radius="md"
              padding="md"
              style={{ textDecoration: "none" }}
              className="hover:shadow-md transition-shadow"
            >
              {juego.meta.imagen && (
                <Card.Section mb="md">
                  <div style={{ position: "relative", height: 140 }}>
                    <Image
                      src={juego.meta.imagen}
                      alt={juego.meta.titulo}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                </Card.Section>
              )}
              <Stack gap="xs">
                <Title order={3} size="h5">
                  {juego.meta.titulo}
                </Title>

                {juego.meta.descripcion && (
                  <Text size="sm" c="dimmed" lineClamp={2}>
                    {juego.meta.descripcion}
                  </Text>
                )}

                {juego.meta.tags && juego.meta.tags.length > 0 && (
                  <Group gap={4} wrap="nowrap">
                    <Tag size={12} />
                    <Group gap={4}>
                      {juego.meta.tags.map((tag) => (
                        <Badge key={tag} size="xs" variant="light">
                          {tag}
                        </Badge>
                      ))}
                    </Group>
                  </Group>
                )}
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  )
}

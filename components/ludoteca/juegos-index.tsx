"use client"

import type { ContentItem, JuegoMeta } from "@/lib/content"
import {
  Badge,
  Card,
  Group,
  Mark,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core"
import Fuse, { type FuseResultMatch } from "fuse.js"
import { Search, Tag } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"

type Rango = readonly [number, number]

const CONTEXTO_PREVIO = 30

function rangosDe(matches: readonly FuseResultMatch[] | undefined, key: string) {
  return (
    matches
      ?.filter((m) => m.key === key && m.value !== undefined)
      .flatMap((m) => [...m.indices] as Rango[]) ?? []
  )
}

function Resaltado({
  texto,
  rangos = [],
  recortar = false,
}: {
  texto: string
  rangos?: Rango[]
  recortar?: boolean
}) {
  let desde = 0
  let prefijo = ""
  if (recortar && rangos.length > 0) {
    const primero = Math.min(...rangos.map((r) => r[0]))
    if (primero > CONTEXTO_PREVIO) {
      const corte = texto.indexOf(" ", primero - CONTEXTO_PREVIO)
      desde = corte !== -1 && corte < primero ? corte + 1 : primero
      prefijo = "…"
    }
  }

  const partes: React.ReactNode[] = []
  let cursor = desde
  const ordenados = [...rangos]
    .filter(([, fin]) => fin >= desde)
    .sort((a, b) => a[0] - b[0])
  for (const [ini, fin] of ordenados) {
    const i = Math.max(ini, cursor)
    if (fin < i) continue
    if (i > cursor) partes.push(texto.slice(cursor, i))
    partes.push(<Mark key={i}>{texto.slice(i, fin + 1)}</Mark>)
    cursor = fin + 1
  }
  partes.push(texto.slice(cursor))
  return (
    <>
      {prefijo}
      {partes}
    </>
  )
}

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
        includeMatches: true,
        minMatchCharLength: 2,
      }),
    [juegos]
  )

  const filtered = useMemo(() => {
    const q = query.trim()
    const results = q
      ? fuse.search(q).map((r) => ({ juego: r.item, matches: r.matches }))
      : juegos.map((juego) => ({ juego, matches: undefined }))
    return results.filter(
      ({ juego }) =>
        activeTags.length === 0 ||
        activeTags.every((t) => juego.meta.tags?.includes(t))
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
          {filtered.map(({ juego, matches }) => (
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
                  <Resaltado
                    texto={juego.meta.titulo}
                    rangos={rangosDe(matches, "meta.titulo")}
                  />
                </Title>

                {juego.meta.descripcion && (
                  <Text size="sm" c="dimmed" lineClamp={2}>
                    <Resaltado
                      texto={juego.meta.descripcion}
                      rangos={rangosDe(matches, "meta.descripcion")}
                      recortar
                    />
                  </Text>
                )}

                {juego.meta.tags && juego.meta.tags.length > 0 && (
                  <Group gap={4} wrap="nowrap">
                    <Tag size={12} />
                    <Group gap={4}>
                      {juego.meta.tags.map((tag, i) => (
                        <Badge key={tag} size="xs" variant="light">
                          <Resaltado
                            texto={tag}
                            rangos={rangosDe(
                              matches?.filter((m) => m.refIndex === i),
                              "meta.tags"
                            )}
                          />
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

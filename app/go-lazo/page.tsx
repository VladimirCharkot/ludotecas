import { getRenderedBySlug, metadataFromContentMeta } from "@/lib/content"
import { ArticlePage } from "@/components/article-page"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Alert } from "@mantine/core"

export async function generateMetadata(): Promise<Metadata> {
  const md = await getRenderedBySlug("articulos", "go-lazo")
  if (!md) return {}
  return metadataFromContentMeta(md.meta)
}

export default async function GoPage() {
  const md = await getRenderedBySlug("articulos", "go-lazo")

  if (!md) {
    return redirect("/")
  }

  return (
    <>
      <div className="max-w-185 mx-auto px-6 mt-8 -mb-8">
        <Link
          href="/go-lazo/invitacion-encuentro-atari-aago-26"
          className="block rounded-md transition-opacity hover:opacity-80"
        >
          <Alert
            variant="light"
            radius="md"
            py="xs"
            title="1.º Encuentro Nacional Escolar de Atari Go"
          >
            El 12 de noviembre, jugada online y gratis para estudiantes de todo
            el país.{" "}
            <span className="font-semibold underline">Ver invitación</span>
          </Alert>
        </Link>
      </div>
      <ArticlePage md={md} className="my-16" />
    </>
  )
}

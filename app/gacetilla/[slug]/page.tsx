import { ArticlePage } from "@/components/article-page"
import type { BaseMeta } from "@/lib/content"
import { getRenderedBySlug } from "@/lib/content"
import { ArrowLeftSquare } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const slug = (await params).slug
  const md = await getRenderedBySlug<BaseMeta>("gacetilla", slug)
  if (!md) return {}
  return {
    title: md.meta.titulo,
    description: md.meta.descripcion,
  }
}

export default async function GacetillaPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const slug = (await params).slug
  const md = await getRenderedBySlug<BaseMeta>("gacetilla", slug)

  const volver = (
    <div className="max-w-185 mx-auto px-6 py-6">
      <Link href="/" className="flex gap-2 items-center">
        <ArrowLeftSquare /> Volver al inicio
      </Link>
    </div>
  )

  if (!md) {
    return redirect("/")
  }

  return (
    <>
      {volver}
      <ArticlePage md={md} />
      {volver}
    </>
  )
}

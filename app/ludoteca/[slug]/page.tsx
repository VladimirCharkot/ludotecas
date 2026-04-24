import { ArticlePage } from "@/components/article-page"
import type { JuegoMeta } from "@/lib/content"
import { getRenderedBySlug } from "@/lib/content"
import { ArrowLeftSquare } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { useMemo } from "react"

export default async function JuegoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const slug = (await params).slug
  const md = await getRenderedBySlug<JuegoMeta>("ludoteca", slug)

  const volver = (
    <div className="max-w-185 mx-auto px-6 py-6">
      <Link href="/ludoteca" className="flex gap-2 items-center">
        <ArrowLeftSquare /> Volver al índice
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

import type { JuegoMeta } from "@/lib/content"
import { getRenderedBySlug } from "@/lib/content"
import { ArticlePage } from "@/components/article-page"
import { redirect } from "next/navigation"

export default async function JuegoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const slug = (await params).slug
  const md = await getRenderedBySlug<JuegoMeta>("ludoteca", slug)

  if (!md) {
    return redirect("/")
  }

  return <ArticlePage md={md} />
}

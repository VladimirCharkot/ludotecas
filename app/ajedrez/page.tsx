import { getRenderedBySlug, metadataFromContentMeta } from "@/lib/content"
import { ArticlePage } from "@/components/article-page"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

export async function generateMetadata(): Promise<Metadata> {
  const md = await getRenderedBySlug("articulos", "ajedrez")
  if (!md) return {}
  return metadataFromContentMeta(md.meta)
}

export default async function AjedrezPage() {
  const md = await getRenderedBySlug("articulos", "ajedrez")

  if (!md) {
    return redirect("/")
  }

  return <ArticlePage md={md} className="my-16" />
}

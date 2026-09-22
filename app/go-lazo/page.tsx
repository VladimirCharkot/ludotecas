import { getRenderedBySlug, metadataFromContentMeta } from "@/lib/content"
import { ArticlePage } from "@/components/article-page"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

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

  return <ArticlePage md={md} className="my-16" />
}

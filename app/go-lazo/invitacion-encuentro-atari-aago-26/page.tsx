import { getRenderedBySlug, metadataFromContentMeta } from "@/lib/content"
import { ArticlePage } from "@/components/article-page"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

const SLUG = "invitacion-encuentro-atari-aago-26"

export async function generateMetadata(): Promise<Metadata> {
  const md = await getRenderedBySlug("articulos", SLUG)
  if (!md) return {}
  return metadataFromContentMeta(md.meta)
}

export default async function InvitacionEncuentroAtariPage() {
  const md = await getRenderedBySlug("articulos", SLUG)

  if (!md) {
    return redirect("/")
  }

  return <ArticlePage md={md} className="my-16" />
}

import { getRenderedBySlug } from "@/lib/content"
import { ArticlePage } from "@/components/article-page"
import { redirect } from "next/navigation"

export default async function AjedrezPage() {
  const md = await getRenderedBySlug(
    "articulos",
    "intro-videojuegos-vacaciones-26"
  )

  if (!md) {
    return redirect("/")
  }

  return <ArticlePage md={md} className="my-16" />
}

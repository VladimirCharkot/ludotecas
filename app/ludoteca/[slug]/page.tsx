import { getRenderedBySlug } from "@/lib/content"
import { redirect } from "next/navigation"
import { toast } from "sonner"

export default async function JuegoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const slug = (await params).slug
  const md = await getRenderedBySlug("ludoteca", slug)

  console.log(md)

  if (!md) {
    toast.error("Juego no encontrado")
    return redirect("/ludoteca")
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: md.html }}
      className="prose max-w-none"
    />
  )
}

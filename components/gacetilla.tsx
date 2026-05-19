import { BaseMeta, getAllContent } from "@/lib/content"
import { GlobitoLink } from "./globito"

export default function Gacetilla() {
  const articulos = getAllContent<BaseMeta & { fecha: string }>("gacetilla")
    .map((a) => ({
      ...a,
      meta: { ...a.meta, fecha: new Date(a.meta.fecha) },
    }))
    .filter((a) => !a.meta.oculto)
    .sort((a, b) => b.meta.fecha.getTime() - a.meta.fecha.getTime())

  return (
    <>
      {articulos.map((articulo) => (
        <GlobitoLink
          key={articulo.slug}
          titulo={`${articulo.meta.fecha.toLocaleDateString("es-AR")} - ${
            articulo.meta.titulo
          }`}
          url={`/gacetilla/${articulo.slug}`}
          alt={`Imagen de ${articulo.meta.titulo}`}
          descripcion={articulo.meta.descripcion}
        />
      ))}
    </>
  )
}

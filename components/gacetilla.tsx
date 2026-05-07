import { BaseMeta, getAllContent } from "@/lib/content"
import { GlobitoLink } from "./globito"

export default function Gacetilla() {
  const articulos = getAllContent<BaseMeta & { fecha: string }>(
    "gacetilla"
  ).map((a) => ({
    ...a,
    meta: { ...a.meta, fecha: new Date(a.meta.fecha) },
  }))
  articulos.sort((a, b) => a.meta.fecha.getTime() - b.meta.fecha.getTime())
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

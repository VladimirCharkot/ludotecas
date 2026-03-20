import Image from "next/image"
import PngBienCbaBlanco from "@/public/biencba_blanco.png"
import PngBienCbaAzul from "@/public/biencba_azul.png"
import LogoProvinciaHorizontal from "@/public/logolema_provincia_h.svg"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Props {
  pie: string
  titulo: string
  className?: string
}

function Reparticion({ pie, titulo, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0 w-max max-w-3xs justify-end",
        className
      )}
    >
      <p className="font-poppins text-base uppercase">{pie}</p>
      <h3 className="font-poppins leading-5 text-lg font-bold uppercase">
        {titulo}
      </h3>
    </div>
  )
}

export const LogoMinisterio = () => (
  <Reparticion pie="Ministerio de" titulo="Educación" />
)

export const LogoSecretaria = () => (
  <Reparticion
    pie="Secretaría de"
    titulo="Fortalecimiento Institucional y Educación Superior"
    className="max-w-[13em]"
  />
)

export const LogoDireccion = () => (
  <Reparticion pie="Dirección General de" titulo="Bienestar Educativo" />
)

export const LogoSubdireccion = () => (
  <Reparticion
    pie="Subdirección de"
    titulo="Participación, Derechos y Comunidad"
    className="max-w-[15em]"
  />
)

/** Renderiza el png adecuado a la dimensión de pantalla */
export const LogoProvincia = () => (
  <Image
    src={LogoProvinciaHorizontal}
    className="mt-4 max-w-3xs"
    alt="Gobierno de la Provincia de Córdoba - Hacer Para Crecer"
  />
)

export const LogoBienCba = ({
  variante,
  className,
}: {
  variante: "texto-blanco" | "texto-azul"
  className?: string
}) => (
  <Link
    href="https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://www.igualdadycalidadcba.gov.ar/SIPEC-CBA/SFI/DGBE/doc/biencba.pdf&ved=2ahUKEwjn3JHlwq6TAxU7C7kGHW0cFZsQFnoECAUQAQ&usg=AOvVaw0NjBMDN9iOLyCo0uWwGqJV"
    target="_blank"
  >
    {variante === "texto-blanco" && (
      <Image
        src={PngBienCbaBlanco}
        className={cn("w-24 mt-4 max-w-3xs", className)}
        alt="BienCBA"
      />
    )}
    {variante === "texto-azul" && (
      <Image
        src={PngBienCbaAzul}
        className={cn("w-24 mt-4 max-w-3xs", className)}
        alt="BienCBA"
      />
    )}
  </Link>
)

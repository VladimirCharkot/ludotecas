import Image from "next/image"
import LogoProvinciaVertical from "@/public/logolema_provincia_v.svg"
import LogoProvinciaHorizontal from "@/public/logolema_provincia_h.svg"

interface Props {
  pie: string
  titulo: string
}

function Reparticion({ pie, titulo }: Props) {
  return (
    <div className={cn("flex flex-col gap-0 w-max max-w-3xs justify-end")}>
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
  />
)

export const LogoDireccion = () => (
  <Reparticion pie="Dirección General de" titulo="Bienestar Educativo" />
)

export const LogoSubdireccion = () => (
  <Reparticion
    pie="Subdirección de"
    titulo="Participación, Derechos y Comunidad"
  />
)

export const LogoProvincia = () => (
  <>
    <Image
      src={LogoProvinciaHorizontal}
      className="mt-4 md:lg-0 hidden md:block max-w-3xs"
      alt="Gobierno de la Provincia de Córdoba - Hacer Para Crecer"
    />
    <Image
      src={LogoProvinciaVertical}
      className="mt-4 md:lg-0 md:hidden max-w-3xs"
      alt="Gobierno de la Provincia de Córdoba - Hacer Para Crecer"
    />
  </>
)

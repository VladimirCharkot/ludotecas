import { Box, createTheme, Flex, MantineProvider } from "@mantine/core"
import "@mantine/core/styles.css"
import { GoogleAnalytics } from "@next/third-parties/google"
import type { Metadata } from "next"
import {
  Barriecito,
  Barrio,
  Poppins,
  Roboto,
  Roboto_Mono,
  Inter,
} from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import Header from "@/components/header"
import Footer from "@/components/footer"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const barrio = Barrio({
  variable: "--font-barrio",
  subsets: ["latin"],
  weight: "400",
})

const barriecito = Barriecito({
  variable: "--font-barriecito",
  subsets: ["latin"],
  weight: "400",
})

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
})

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: "400",
})

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: "400",
})

export const metadata: Metadata = {
  title: "Ludotecas, Ajedrez y Go",
  description:
    "Programa Ludotecas, Ajedrez y Go de la Subdirección de Participación, Derechos y Comunidad del Ministerio de Educación de la Provincia de Córdoba",
  openGraph: {
    title: "Ludotecas, Ajedrez y Go",
    description:
      "Programa Ludotecas, Ajedrez y Go de la Subdirección de Participación, Derechos y Comunidad del Ministerio de Educación de la Provincia de Córdoba",
    url: "https://ludotecascba.vercel.app",
    siteName: "Ludotecas, Ajedrez y Go",
    images: [
      {
        url: "https://ludotecascba.vercel.app/logo_ludotecas.svg",
        width: 480,
        height: 480,
      },
    ],
    locale: "es_AR",
    type: "website",
  },
}

const theme = createTheme({
  fontFamily: "var(--font-poppins), sans-serif",
  headings: {
    fontFamily: "var(--font-barrio), cursive",
  },
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "antialiased",
        barrio.variable,
        barriecito.variable,
        poppins.variable,
        roboto.variable,
        robotoMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <Toaster />
        <MantineProvider theme={theme}>
          <Flex direction="column" mih="100vh">
            <Flex direction="column" flex={1}>
              <Header />
              <Box component="main" flex={1} className="overflow-auto">
                {children}
              </Box>
              <Footer />
            </Flex>
          </Flex>
        </MantineProvider>
      </body>
      <GoogleAnalytics gaId="G-QHE3Q21YW7" />
    </html>
  )
}

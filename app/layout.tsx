import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ludotecas, Ajedrez y Go",
  description: "Programa Ludotecas, Ajedrez y Go de la Subdirección de Participación, Derechos y Comunidad del Ministerio de Educación de la Provincia de Córdoba",
  openGraph: {
    title: 'Ludotecas, Ajedrez y Go',
    description: 'Programa Ludotecas, Ajedrez y Go de la Subdirección de Participación, Derechos y Comunidad del Ministerio de Educación de la Provincia de Córdoba',
    url: 'https://ludotecascba.vercel.app',
    siteName: 'Ludotecas, Ajedrez y Go',
    images: [
      {
        url: 'https://ludotecascba.vercel.app/logo_ludotecas.svg',
        width: 480,
        height: 480,
      },
    ],
    locale: 'es_AR',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

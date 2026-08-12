"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Select } from "@mantine/core"
import type { Pin, SinCoordenadas } from "./types"

const CORDOBA_CAPITAL = { lat: -31.4201, lng: -64.1888 }

// Color por categoría de origen, no por confianza de match (eso se sacó del
// esquema viejo auto/revision/sin_escuela). Un pin puede tener más de una
// fuente de Maestra a la vez (ej. "C1 Ludotecas;C1 Programación") — eso NO
// cuenta como pertenecer a más de una de las 4 categorías de arriba, así que
// tiene su propio tono "ambos" en vez de caer en blanco.
const COLOR_CINCUENTA = "#2563eb" // 50 Ludotecas (BP incluido) -> azul
const COLOR_ESCOLAR = "#dc2626" // relevamiento, con escuela resuelta -> rojo
const COLOR_NO_ESCOLAR = "#f97316" // relevamiento, sin escuela -> naranja
const COLOR_C1_LUDOTECAS = "#a78bfa" // violeta claro
const COLOR_C1_PROGRAMACION = "#6d28d9" // violeta oscuro
const COLOR_C1_AMBOS = "#8b5cf6" // violeta medio (rara vez: ambos C1)
const COLOR_PIBE = "#4ade80" // verde claro
const COLOR_PIE = "#15803d" // verde oscuro
const COLOR_PIBE_PIE_AMBOS = "#22c55e" // verde medio (rara vez: ambos PIBE y PIE)
const COLOR_MULTI = "#ffffff" // pertenece a más de una de las 4 categorías

const LEGEND: { color: string; label: string }[] = [
  { color: COLOR_CINCUENTA, label: "50 Ludotecas" },
  { color: COLOR_ESCOLAR, label: "Relevamiento (escolar)" },
  { color: COLOR_NO_ESCOLAR, label: "Relevamiento (no escolar)" },
  { color: COLOR_C1_LUDOTECAS, label: "C1 Ludotecas" },
  { color: COLOR_C1_PROGRAMACION, label: "C1 Programación" },
  { color: COLOR_PIBE, label: "PIBE" },
  { color: COLOR_PIE, label: "PIE" },
  { color: COLOR_MULTI, label: "Más de una categoría" },
]

// Se infiere de que haya payload del form -- no hace falta un campo nuevo en
// Pin. Mismo criterio que ya usaba DetailPanel para mostrar "Sobre la
// Ludoteca", reusado acá para el color y para el tag "Relevamiento".
function tieneFormulario(pin: Pin): boolean {
  return Object.keys(pin.payload).length > 0
}

// Las 4 categorías que pidió el usuario para colorear pines. "fuentes" viene
// de Maestra (puede tener varias a la vez).
function pinColor(pin: Pin): string {
  const tiene50 = pin.fuentes.some((f) => f.startsWith("50 Ludotecas"))
  const tieneC1Ludotecas = pin.fuentes.includes("C1 Ludotecas")
  const tieneC1Programacion = pin.fuentes.includes("C1 Programación")
  const tieneC1 = tieneC1Ludotecas || tieneC1Programacion
  const tienePibe = pin.fuentes.includes("PIBE")
  const tienePie = pin.fuentes.includes("PIE")
  const tienePibePie = tienePibe || tienePie

  const categorias = [
    tiene50,
    tieneC1,
    tienePibePie,
    tieneFormulario(pin),
  ].filter(Boolean).length
  if (categorias > 1) return COLOR_MULTI

  if (tiene50) return COLOR_CINCUENTA
  if (tieneC1) {
    if (tieneC1Ludotecas && tieneC1Programacion) return COLOR_C1_AMBOS
    return tieneC1Ludotecas ? COLOR_C1_LUDOTECAS : COLOR_C1_PROGRAMACION
  }
  if (tienePibePie) {
    if (tienePibe && tienePie) return COLOR_PIBE_PIE_AMBOS
    return tienePibe ? COLOR_PIBE : COLOR_PIE
  }
  return pin.escuela ? COLOR_ESCOLAR : COLOR_NO_ESCOLAR
}

// El seleccionado usa el tamaño "nítido" (32); el resto achica un poco para
// que el highlight se note sin necesitar upscaling, que pixela el ícono.
const MARKER_SIZE_BASE = 26
const MARKER_SIZE_SELECTED = 32

const PIN_SVG_URL = "/assets/pin-mapa.svg"
const PIN_FILL_ID = "pin-fill"
// public/assets/pin-mapa.svg es un pin tipo "globo" (viewBox 0 0 62 62), no
// un punto centrado como el ícono viejo de Google -- la punta que marca la
// ubicación real está en (32,59), no en el centro (31,31). Sin este ajuste
// el pin queda flotando arriba a la izquierda de la coordenada real.
const PIN_ANCHOR_X_RATIO = 32 / 62
const PIN_ANCHOR_Y_RATIO = 59 / 62

// Carga el SVG una sola vez y devuelve una función que, dado un color, arma
// el data URL con el path #pin-fill pintado de ese color (cacheado por color
// para no reparsear/reserializar en cada marker). Vía DOMParser en vez de
// reemplazo de texto: más robusto que un regex contra el XML del archivo.
async function loadPinIconFactory(): Promise<(color: string) => string> {
  const template = await fetch(PIN_SVG_URL).then((res) => res.text())
  const cache = new Map<string, string>()

  return (color: string) => {
    const cached = cache.get(color)
    if (cached) return cached

    const doc = new DOMParser().parseFromString(template, "image/svg+xml")
    const fillPath = doc.getElementById(PIN_FILL_ID)
    fillPath?.setAttribute("style", `fill:${color};`)
    const svg = new XMLSerializer().serializeToString(doc)
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
    cache.set(color, dataUrl)
    return dataUrl
  }
}

function pinIcon(
  makeIconUrl: (color: string) => string,
  color: string,
  size: number
): google.maps.Icon {
  return {
    url: makeIconUrl(color),
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(
      size * PIN_ANCHOR_X_RATIO,
      size * PIN_ANCHOR_Y_RATIO
    ),
  }
}

// Campos del form que ya se muestran en un lugar dedicado del panel; el
// resto se lista genéricamente en "Sobre la Ludoteca".
const CAMPOS_YA_MOSTRADOS = new Set([
  "Timestamp",
  "Nombre de la institución",
  "Localidad",
  "Departamento",
  "Nro de CUE",
  "Nivel y modalidad ",
  "Docente referente de la ludoteca",
  "Correo electrónico de contacto",
  "Teléfono de contacto",
])

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ")
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (window.google?.maps) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("No se pudo cargar Google Maps"))
    document.head.appendChild(script)
  })
}

// El header de esta columna en el form incluye un salto de línea y puede
// variar en puntuación; matcheamos por prefijo en vez de por igualdad exacta.
function isCampoFotos(key: string): boolean {
  return key.trim().startsWith("Les invitamos a compartir fotos")
}

function driveFileId(url: string): string | null {
  const match = url.match(/[?&]id=([^&]+)/) ?? url.match(/\/d\/([^/]+)/)
  return match ? match[1] : null
}

const FOTO_MAX_REINTENTOS = 3

function DriveFoto({ url }: { url: string }) {
  const [intento, setIntento] = useState(0)
  const [broken, setBroken] = useState(false)
  const id = driveFileId(url)

  if (!id || broken) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs underline break-all"
      >
        {url}
      </a>
    )
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <img
        // El "retry" cambia la URL para forzar un pedido nuevo: Drive
        // ocasionalmente falla thumbnails hotlinked si llegan muchos pedidos
        // juntos (varias fotos de la misma ficha cargando a la vez), aunque
        // el archivo sea público — un reintento con backoff suele resolverlo.
        src={`https://drive.google.com/thumbnail?id=${id}&sz=w400&retry=${intento}`}
        alt="Foto de la ludoteca"
        loading="lazy"
        onError={() => {
          if (intento < FOTO_MAX_REINTENTOS) {
            setTimeout(() => setIntento((n) => n + 1), 500 * (intento + 1))
          } else {
            setBroken(true)
          }
        }}
        style={{
          width: 120,
          height: 120,
          objectFit: "cover",
          borderRadius: 6,
        }}
      />
    </a>
  )
}

function FuentesTags({ fuentes }: { fuentes: string[] }) {
  if (fuentes.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {fuentes.map((fuente) => (
        <span
          key={fuente}
          className="text-xs rounded-full border px-2 py-0.5"
          style={{ borderColor: "currentColor" }}
        >
          {fuente}
        </span>
      ))}
    </div>
  )
}

function DetailPanel({ pin }: { pin: Pin }) {
  const nivelYModalidad = pin.payload["Nivel y modalidad "]
  const docente = pin.payload["Docente referente de la ludoteca"]
  const correo = pin.payload["Correo electrónico de contacto"]
  const telefono = pin.payload["Teléfono de contacto"]
  const fotos = (
    Object.entries(pin.payload).find(([key]) => isCampoFotos(key))?.[1] ?? ""
  )
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean)
  const resto = Object.entries(pin.payload).filter(
    ([key, value]) =>
      !CAMPOS_YA_MOSTRADOS.has(key) && !isCampoFotos(key) && value.trim()
  )

  return (
    <div>
      <h3 className="font-barriecito text-2xl mb-4">{titleCase(pin.nombre)}</h3>

      <div className="mb-4">
        <FuentesTags
          fuentes={
            tieneFormulario(pin)
              ? [...pin.fuentes, "Relevamiento"]
              : pin.fuentes
          }
        />
      </div>

      {pin.escuela && (
        <div className="mb-2 flex flex-col gap-2">
          <p>
            <strong>Escuela:</strong> {titleCase(pin.escuela.nombre)}
          </p>
          {pin.escuela.cue && (
            <p>
              <strong>CUE:</strong> {pin.escuela.cue}
            </p>
          )}
          {nivelYModalidad && (
            <p>
              <strong>{nivelYModalidad}</strong>
            </p>
          )}
          <p>
            <strong>
              {pin.localidad} {pin.departamento && "/"} {pin.departamento}
            </strong>
          </p>
          <p>{titleCase(pin.escuela.domicilio)}</p>
          {pin.escuela.orientacion && (
            <div>
              <p>
                <strong>
                  Orientación{" "}
                  <span className="text-xs">(Según padrón DGSec)</span>:
                </strong>
              </p>
              <p>{titleCase(pin.escuela.orientacion)} </p>
            </div>
          )}
        </div>
      )}

      {!pin.escuela && (
        <p>
          {pin.localidad} {pin.departamento && "/"} {pin.departamento}{" "}
          {tieneFormulario(pin) && "— sin escuela asignada"}
        </p>
      )}

      {resto.length > 0 && (
        <div className="flex flex-col gap-4 mt-6">
          <h4 className="font-barriecito text-2xl">Sobre la Ludoteca</h4>
          {(docente || correo || telefono) && (
            <div>
              <h4 className="font-semibold">Datos de contacto</h4>
              <p>{[docente, correo, telefono].filter(Boolean).join(" — ")}</p>
            </div>
          )}
          {fotos.length > 0 && (
            <div className="flex flex-col gap-2 mt-6">
              <h4 className="font-barriecito text-2xl">Fotos</h4>
              <div className="flex flex-wrap gap-2">
                {fotos.map((url) => (
                  <DriveFoto key={url} url={url} />
                ))}
              </div>
            </div>
          )}
          <ul className="text-xs flex flex-col gap-1.5">
            {resto.map(([key, value]) => (
              <li key={key}>
                <div>
                  <p>
                    <strong>{key.trim()}</strong>
                  </p>{" "}
                  <p>{value}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function MapView({
  apiKey,
  pins,
  sinCoordenadas,
}: {
  apiKey: string
  pins: Pin[]
  sinCoordenadas: SinCoordenadas[]
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const detailsRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const pinIconFactoryRef = useRef<((color: string) => string) | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const pinsById = useMemo(
    () => new Map(pins.map((pin) => [pin.id, pin])),
    [pins]
  )
  const selectedPin =
    selectedId != null ? pinsById.get(selectedId) ?? null : null
  const selectOptions = useMemo(
    () =>
      pins
        .map((pin) => ({
          value: pin.id,
          label: titleCase(pin.nombre),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [pins]
  )

  useEffect(() => {
    let cancelled = false

    Promise.all([loadGoogleMaps(apiKey), loadPinIconFactory()]).then(
      ([, makeIconUrl]) => {
        if (cancelled || !mapContainerRef.current) return
        pinIconFactoryRef.current = makeIconUrl

        const center = pins.length
          ? {
              lat: pins.reduce((sum, p) => sum + p.lat, 0) / pins.length,
              lng: pins.reduce((sum, p) => sum + p.lng, 0) / pins.length,
            }
          : CORDOBA_CAPITAL

        const map = new google.maps.Map(mapContainerRef.current, {
          center,
          zoom: pins.length ? 8 : 7,
          streetViewControl: false,
          mapTypeControl: false,
          cameraControl: false,
          backgroundColor: "#fef9ed",
        })
        mapRef.current = map

        for (const pin of pins) {
          const marker = new google.maps.Marker({
            position: { lat: pin.lat, lng: pin.lng },
            map,
            title: pin.nombre,
            icon: pinIcon(makeIconUrl, pinColor(pin), MARKER_SIZE_BASE),
          })
          marker.addListener("click", () => setSelectedId(pin.id))
          markersRef.current.set(pin.id, marker)
        }
      }
    )

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey])

  useEffect(() => {
    detailsRef.current?.scrollTo(0, 0)
  }, [selectedId])

  // Resalta y centra el pin seleccionado (por click en el mapa o desde el Select).
  useEffect(() => {
    const map = mapRef.current
    const makeIconUrl = pinIconFactoryRef.current
    if (!map || !makeIconUrl) return

    for (const [id, marker] of markersRef.current) {
      const pin = pinsById.get(id)
      if (!pin) continue
      const isSelected = id === selectedId
      marker.setZIndex(isSelected ? 999 : undefined)
      marker.setIcon(
        pinIcon(
          makeIconUrl,
          pinColor(pin),
          isSelected ? MARKER_SIZE_SELECTED : MARKER_SIZE_BASE
        )
      )
    }

    if (selectedId == null) return

    const marker = markersRef.current.get(selectedId)
    const pin = pinsById.get(selectedId)
    if (!marker || !pin) return

    map.panTo({ lat: pin.lat, lng: pin.lng })
    if ((map.getZoom() ?? 0) < 12) map.setZoom(12)

    marker.setAnimation(google.maps.Animation.BOUNCE)
    const timeout = setTimeout(() => marker.setAnimation(null), 1400)

    return () => {
      clearTimeout(timeout)
      marker.setAnimation(null)
    }
  }, [selectedId, pinsById])

  return (
    <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
      <div style={{ flex: "2 1 500px" }}>
        <div
          style={{
            marginBottom: 8,
            fontSize: 13,
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          {LEGEND.map(({ color, label }) => (
            <span
              key={label}
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: color,
                  border: "1px solid #1f2937",
                }}
              />
              {label}
            </span>
          ))}
        </div>
        <div
          ref={mapContainerRef}
          style={{ height: "70vh", width: "100%", borderRadius: "6px" }}
        />
      </div>

      <div
        style={{
          flex: "1 1 320px",
          maxHeight: "70vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Select
          placeholder="Buscar ludoteca..."
          data={selectOptions}
          value={selectedId}
          onChange={(value) => setSelectedId(value)}
          searchable
          clearable
          nothingFoundMessage="No se encontró ninguna ludoteca"
        />
        <p className="text-xs px-2 py-1 mb-4">
          {selectOptions.length} ludotecas
        </p>

        <div ref={detailsRef} style={{ overflowY: "auto" }}>
          {selectedPin ? (
            <DetailPanel pin={selectedPin} />
          ) : (
            <p style={{ opacity: 0.7 }}>
              Hacé click en un pin o elegí una ludoteca en el buscador.
            </p>
          )}

          {sinCoordenadas.length > 0 && (
            <>
              <h4 style={{ marginTop: "2rem" }}>
                Sin ubicación ({sinCoordenadas.length})
              </h4>
              <ul style={{ fontSize: 14 }}>
                {sinCoordenadas.map((l) => (
                  <li key={l.id}>
                    {l.nombre} — {l.localidad} / {l.departamento}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

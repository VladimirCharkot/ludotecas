"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Select } from "@mantine/core"
import type { Pin, PinColor, SinCoordenadas } from "./types"

const CORDOBA_CAPITAL = { lat: -31.4201, lng: -64.1888 }

const MARKER_ICON: Record<PinColor, string> = {
  auto: "red",
  revision: "orange",
  sin_escuela: "blue",
}

// El PNG nativo de Google es 32x32. El seleccionado usa esa resolución
// (nítida); el resto achica un poco para que el highlight se note sin
// necesitar upscaling, que pixela el ícono.
const MARKER_SIZE_BASE = 26
const MARKER_SIZE_SELECTED = 32

function markerIconUrl(color: PinColor): string {
  return `https://maps.google.com/mapfiles/ms/icons/${MARKER_ICON[color]}-dot.png`
}

function pinIcon(color: PinColor, size: number): google.maps.Icon {
  return {
    url: markerIconUrl(color),
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
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
              {pin.localidad} / {pin.departamento}
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
          {pin.localidad} / {pin.departamento} — sin escuela asignada
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
  const markersRef = useRef<Map<number, google.maps.Marker>>(new Map())
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const pinsById = useMemo(
    () => new Map(pins.map((pin) => [pin.ludotecaId, pin])),
    [pins]
  )
  const selectedPin =
    selectedId != null ? pinsById.get(selectedId) ?? null : null
  const selectOptions = useMemo(
    () =>
      pins
        .map((pin) => ({
          value: String(pin.ludotecaId),
          label: titleCase(pin.nombre),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [pins]
  )

  useEffect(() => {
    let cancelled = false

    loadGoogleMaps(apiKey).then(() => {
      if (cancelled || !mapContainerRef.current) return

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
          icon: pinIcon(pin.color, MARKER_SIZE_BASE),
        })
        marker.addListener("click", () => setSelectedId(pin.ludotecaId))
        markersRef.current.set(pin.ludotecaId, marker)
      }
    })

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
    if (!map) return

    for (const [id, marker] of markersRef.current) {
      const pin = pinsById.get(id)
      if (!pin) continue
      const isSelected = id === selectedId
      marker.setZIndex(isSelected ? 999 : undefined)
      marker.setIcon(
        pinIcon(pin.color, isSelected ? MARKER_SIZE_SELECTED : MARKER_SIZE_BASE)
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
        {/* Referencia */}
        {/* <div style={{ marginBottom: 8, fontSize: 14 }}>
          <span style={{ color: "red" }}>●</span> auto &nbsp;
          <span style={{ color: "orange" }}>●</span> revisión &nbsp;
          <span style={{ color: "blue" }}>●</span> sin escuela
        </div> */}
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
          value={selectedId != null ? String(selectedId) : null}
          onChange={(value) => setSelectedId(value ? Number(value) : null)}
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
                  <li key={l.ludotecaId}>
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

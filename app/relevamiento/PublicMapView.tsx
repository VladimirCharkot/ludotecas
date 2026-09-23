"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Select } from "@mantine/core"
import type { PublicPin } from "@/lib/map-types"
import {
  CORDOBA_CAPITAL,
  COLOR_ESCOLAR,
  MARKER_SIZE_BASE,
  MARKER_SIZE_SELECTED,
  loadGoogleMaps,
  loadPinIconFactory,
  pinIcon,
  titleCase,
} from "@/lib/map-utils"

// Sin distinción de categoría/fuente/programa en el mapa público -- todos
// los pines llevan el mismo color.
const PIN_COLOR = COLOR_ESCOLAR

function DetailPanel({ pin }: { pin: PublicPin }) {
  return (
    <div>
      <h3 className="font-barriecito text-2xl mb-4">{titleCase(pin.nombre)}</h3>
    </div>
  )
}

export function PublicMapView({
  apiKey,
  pins,
}: {
  apiKey: string
  pins: PublicPin[]
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
        .map((pin) => ({ value: pin.id, label: titleCase(pin.nombre) }))
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
            icon: pinIcon(makeIconUrl, PIN_COLOR, MARKER_SIZE_BASE),
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
          PIN_COLOR,
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
          ref={mapContainerRef}
          style={{ height: "70vh", width: "100%", borderRadius: "6px" }}
        />
        <p className="text-xs opacity-60 mt-1">
          Algunas ubicaciones son aproximadas
        </p>
        <p className="text-xs opacity-60">
          ¿Ves algo incorrecto?{" "}
          <a
            href="https://forms.gle/2Txcpf8HViypwL1B8"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Informanos acá
          </a>
        </p>
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
          withAlignedLabels
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
        </div>
      </div>
    </div>
  )
}

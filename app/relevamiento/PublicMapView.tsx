"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Select } from "@mantine/core"
import type { Pin } from "@/lib/map-types"
import { CAMPO_CONTACTO, CAMPOS_SOBRE_LUDOTECA } from "@/lib/relevamiento-fields"
import {
  CORDOBA_CAPITAL,
  COLOR_ESCOLAR,
  COLOR_NO_ESCOLAR,
  MARKER_SIZE_BASE,
  MARKER_SIZE_SELECTED,
  loadGoogleMaps,
  loadPinIconFactory,
  pinIcon,
  titleCase,
} from "@/lib/map-utils"

function pinColor(pin: Pin): string {
  return pin.escuela ? COLOR_ESCOLAR : COLOR_NO_ESCOLAR
}

function DetailPanel({ pin }: { pin: Pin }) {
  const contacto = pin.payload[CAMPO_CONTACTO]
  const respuestas = CAMPOS_SOBRE_LUDOTECA.map(
    (campo) => [campo, pin.payload[campo]] as const
  ).filter(([, valor]) => valor)

  return (
    <div>
      <h3 className="font-barriecito text-2xl mb-4">{titleCase(pin.nombre)}</h3>

      {pin.escuela ? (
        <div className="mb-2 flex flex-col gap-2">
          <p>
            <strong>Escuela:</strong> {titleCase(pin.escuela.nombre)}
          </p>
          <p>
            <strong>
              {pin.localidad} {pin.departamento && "/"} {pin.departamento}
            </strong>
          </p>
          <p>{titleCase(pin.escuela.domicilio)}</p>
        </div>
      ) : (
        <p>
          {pin.localidad} {pin.departamento && "/"} {pin.departamento}
        </p>
      )}

      {(contacto || respuestas.length > 0) && (
        <div className="flex flex-col gap-4 mt-6">
          <h4 className="font-barriecito text-2xl">Sobre la Ludoteca</h4>
          {contacto && (
            <div>
              <h4 className="font-semibold">Contacto</h4>
              <p>{contacto}</p>
            </div>
          )}
          <ul className="text-xs flex flex-col gap-1.5">
            {respuestas.map(([campo, valor]) => (
              <li key={campo}>
                <div>
                  <p>
                    <strong>{campo}</strong>
                  </p>{" "}
                  <p>{valor}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function PublicMapView({ apiKey, pins }: { apiKey: string; pins: Pin[] }) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const detailsRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const pinIconFactoryRef = useRef<((color: string) => string) | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const pinsById = useMemo(() => new Map(pins.map((pin) => [pin.id, pin])), [pins])
  const selectedPin = selectedId != null ? pinsById.get(selectedId) ?? null : null
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
          withAlignedLabels
          nothingFoundMessage="No se encontró ninguna ludoteca"
        />
        <p className="text-xs px-2 py-1 mb-4">{selectOptions.length} ludotecas</p>

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

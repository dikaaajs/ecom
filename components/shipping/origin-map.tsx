"use client";

import { useEffect, useMemo } from "react";
import { divIcon, type Marker as LeafletMarker } from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

type Coords = { latitude: number; longitude: number };
type Props = { value: Coords | null; onChange: (coords: Coords) => void };

const fallback: [number, number] = [-2.5489, 118.0149];
const bounds: [[number, number], [number, number]] = [[-11.5, 94], [6.5, 142]];

function PinSelector({ onChange }: { onChange: Props["onChange"] }) {
  useMapEvents({
    click(event) {
      onChange({
        latitude: Number(event.latlng.lat.toFixed(6)),
        longitude: Number(event.latlng.lng.toFixed(6)),
      });
    },
  });
  return null;
}

function Recenter({ value }: { value: Coords | null }) {
  const map = useMap();
  useEffect(() => {
    if (value) map.setView([value.latitude, value.longitude], Math.max(14, map.getZoom()));
  }, [map, value?.latitude, value?.longitude]);
  return null;
}

export default function OriginMap({ value, onChange }: Props) {
  const icon = useMemo(() => divIcon({
    className: "shipping-origin-marker",
    html: '<div class="shipping-origin-pin"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-7.14 7-13A7 7 0 0 0 5 9c0 5.86 7 13 7 13Z" fill="#2563eb" stroke="white" stroke-width="1.3"/><circle cx="12" cy="9" r="2.8" fill="white"/></svg></div>',
    iconSize: [46, 52], iconAnchor: [23, 50],
  }), []);
  return (
    <MapContainer
      center={value ? [value.latitude, value.longitude] : fallback}
      zoom={value ? 15 : 5}
      minZoom={4}
      maxZoom={19}
      maxBounds={bounds}
      maxBoundsViscosity={1}
      scrollWheelZoom={false}
      className="shipping-origin-map h-[320px] w-full rounded-2xl sm:h-[410px]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <PinSelector onChange={onChange} />
      <Recenter value={value} />
      {value && (
        <Marker
          position={[value.latitude, value.longitude]}
          icon={icon}
          draggable
          eventHandlers={{
            dragend(event) {
              const p = (event.target as LeafletMarker).getLatLng();
              onChange({ latitude: Number(p.lat.toFixed(6)), longitude: Number(p.lng.toFixed(6)) });
            },
          }}
        />
      )}
    </MapContainer>
  );
}

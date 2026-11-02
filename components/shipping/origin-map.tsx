"use client";

import { useEffect, useRef } from "react";
import L, { type Map as LeafletMap, type Marker as LeafletMarker } from "leaflet";

type Coords = { latitude: number; longitude: number };
type Props = { value: Coords | null; onChange: (coords: Coords) => void; ariaLabel?: string };

const fallback: [number, number] = [-2.5489, 118.0149];
const bounds: L.LatLngBoundsExpression = [[-11.5, 94], [6.5, 142]];

const pinIcon = L.divIcon({
  className: "shipping-origin-marker",
  html: '<div class="shipping-origin-pin"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-7.14 7-13A7 7 0 0 0 5 9c0 5.86 7 13 7 13Z" fill="#2563eb" stroke="white" stroke-width="1.3"/><circle cx="12" cy="9" r="2.8" fill="white"/></svg></div>',
  iconSize: [46, 52],
  iconAnchor: [23, 50],
});

const roundedCoords = (latitude: number, longitude: number): Coords => ({
  latitude: Number(latitude.toFixed(6)),
  longitude: Number(longitude.toFixed(6)),
});

export default function OriginMap({ value, onChange, ariaLabel = "Peta lokasi asal pengiriman. Klik peta untuk memasang pin atau geser pin untuk menyesuaikan." }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const onChangeRef = useRef(onChange);
  const lastPinRef = useRef<string | null>(null);
  onChangeRef.current = onChange;

  // Leaflet is initialized and disposed exclusively by this effect. Its cleanup
  // also runs during React StrictMode effect replay in Next.js development.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const map = L.map(element, {
      center: value ? [value.latitude, value.longitude] : fallback,
      zoom: value ? 15 : 5,
      minZoom: 4,
      maxZoom: 19,
      maxBounds: bounds,
      maxBoundsViscosity: 1,
      scrollWheelZoom: false,
    });
    mapRef.current = map;

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    map.on("click", event => {
      onChangeRef.current(roundedCoords(event.latlng.lat, event.latlng.lng));
    });

    return () => {
      map.off();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      lastPinRef.current = null;
    };
    // Initial location only: subsequent coordinate changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      lastPinRef.current = null;
      return;
    }

    const key = `${value.latitude},${value.longitude}`;
    const position: L.LatLngExpression = [value.latitude, value.longitude];
    if (markerRef.current) {
      markerRef.current.setLatLng(position);
    } else {
      markerRef.current = L.marker(position, { draggable: true, icon: pinIcon }).addTo(map);
      markerRef.current.on("dragend", () => {
        const point = markerRef.current?.getLatLng();
        if (point) onChangeRef.current(roundedCoords(point.lat, point.lng));
      });
    }
    if (lastPinRef.current !== key) {
      map.setView(position, Math.max(14, map.getZoom()));
      lastPinRef.current = key;
    }
  }, [value?.latitude, value?.longitude]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label={ariaLabel}
      className="shipping-origin-map h-[320px] w-full rounded-2xl sm:h-[410px]"
    />
  );
}

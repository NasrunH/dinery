"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface MapUpdaterProps {
  center: [number, number];
}

function MapUpdater({ center }: MapUpdaterProps) {
  const map = useMap();

  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, Math.max(map.getZoom(), 15), { animate: true, duration: 0.8 });
      // Invalidate size agar tile ter-render penuh saat container form mekar
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [center, map]);

  return null;
}

interface MapPreviewLeafletProps {
  lat: number;
  lng: number;
  placeName?: string;
  addressText?: string;
}

export default function MapPreviewLeaflet({
  lat,
  lng,
  placeName,
  addressText,
}: MapPreviewLeafletProps) {
  const position: [number, number] = [lat, lng];

  const markerIcon = useMemo(() => {
    if (typeof window === "undefined" || !L) return undefined;

    return L.divIcon({
      className: "bg-transparent border-none",
      html: `
        <div class="relative flex items-center justify-center filter drop-shadow-lg transition-transform hover:scale-110" style="width: 36px; height: 44px;">
          <svg viewBox="0 0 24 32" width="36" height="44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20c0-6.63-5.37-12-12-12z" fill="#f43f5e"/>
            <circle cx="12" cy="11" r="5" fill="white"/>
            <path d="M12 8.5v5M9.5 11h5" stroke="#f43f5e" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </div>
      `,
      iconSize: [36, 44],
      iconAnchor: [18, 44],
      popupAnchor: [0, -40],
    });
  }, []);

  return (
    <MapContainer
      center={position}
      zoom={15}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", zIndex: 10 }}
      attributionControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater center={position} />
      <Marker position={position} icon={markerIcon}>
        <Popup>
          <div className="text-center p-1 min-w-[140px] max-w-[220px]">
            <p className="font-bold text-gray-800 text-xs mb-0.5 line-clamp-1">
              {placeName || "Lokasi Terpilih"}
            </p>
            {addressText ? (
              <p className="text-[10px] text-gray-500 line-clamp-2 leading-tight">
                {addressText}
              </p>
            ) : (
              <p className="text-[10px] text-gray-400 font-mono">
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </p>
            )}
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}


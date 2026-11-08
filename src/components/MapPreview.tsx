"use client";

import dynamic from "next/dynamic";
import { MapPin, Loader2, ExternalLink, Compass } from "lucide-react";

// Import Leaflet map component dynamically with SSR disabled
const MapPreviewLeaflet = dynamic(
  () => import("@/components/MapPreviewLeaflet"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 gap-2">
        <Loader2 className="animate-spin text-primary-500" size={24} />
        <span className="text-xs font-medium">Memuat peta...</span>
      </div>
    ),
  }
);

interface MapPreviewProps {
  lat?: number | null;
  lng?: number | null;
  placeName?: string;
  addressText?: string;
  mapsLink?: string;
  isLoading?: boolean;
  className?: string;
}

export default function MapPreview({
  lat,
  lng,
  placeName,
  addressText,
  mapsLink,
  isLoading = false,
  className = "",
}: MapPreviewProps) {
  const hasCoords = typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 ml-1">
          <Compass size={15} className="text-primary-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Preview Peta Lokasi
          </span>
          {isLoading ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
              <Loader2 size={10} className="animate-spin" /> Mendeteksi titik...
            </span>
          ) : hasCoords ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Titik Terdeteksi
            </span>
          ) : null}
        </div>

        {mapsLink && (
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 hover:underline mr-1 transition"
            title="Buka lokasi di Google Maps"
          >
            <span>Buka Maps</span>
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Map display box */}
      <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800/80 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-inner">
        {isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-gray-50/80 to-gray-100/80 dark:from-gray-800/80 dark:to-gray-900/80">
            <div className="w-12 h-12 rounded-2xl bg-primary-100/70 dark:bg-primary-950/80 text-primary-500 flex items-center justify-center mb-2 shadow-xs">
              <Loader2 size={24} className="animate-spin" />
            </div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
              Menghubungkan ke Google Maps...
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
              Mengambil titik koordinat pin dan alamat presisi.
            </p>
          </div>
        ) : hasCoords ? (
          <>
            <MapPreviewLeaflet
              lat={lat!}
              lng={lng!}
              placeName={placeName}
              addressText={addressText}
            />

            {/* Bottom-left coordinate pill */}
            <div className="absolute bottom-2 left-2 z-[400] bg-black/70 backdrop-blur-md text-white text-[10px] font-mono px-2 py-1 rounded-lg shadow flex items-center gap-1 border border-white/10 pointer-events-none">
              <MapPin size={11} className="text-rose-400 shrink-0" />
              <span>
                {lat!.toFixed(5)}, {lng!.toFixed(5)}
              </span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gray-50/50 dark:bg-gray-900/50">
            <div className="w-12 h-12 rounded-2xl bg-gray-200/60 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 mb-2">
              <MapPin size={24} className="opacity-60" />
            </div>
            <p className="text-xs font-bold text-gray-600 dark:text-gray-300">
              Belum Ada Titik Lokasi
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 max-w-[240px]">
              Tempel tautan Google Maps di atas untuk melihat preview peta secara otomatis.
            </p>
          </div>
        )}
      </div>

      {hasCoords && !isLoading && (
        <p className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">
          *Peta interaktif: kamu bisa geser atau zoom untuk memastikan posisi tempat makan sudah pas.
        </p>
      )}
    </div>
  );
}


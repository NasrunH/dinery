"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Place } from "@/types";
import Link from "next/link";
import { parsePostGISPoint } from "@/lib/wkbParser"; // Import parser baru

// Helper Recenter
function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

interface MapComponentProps {
    places: any[]; // Gunakan any dulu karena tipe Place belum punya field 'location'
    userLocation: { lat: number; long: number } | null;
}

export default function MapComponent({ places, userLocation }: MapComponentProps) {
    // Default Jakarta
    const defaultCenter: [number, number] = userLocation 
        ? [userLocation.lat, userLocation.long] 
        : [-6.2088, 106.8456];

    // --- MEMOIZE ICONS (Fixes Runtime Error) ---
    // Pindahkan inisialisasi L.Icon ke dalam komponen/useMemo
    // untuk memastikan Leaflet sudah siap di browser environment.
    const { wishlistIcon, visitedIcon } = useMemo(() => {
        const shadowUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png";
        
        return {
            wishlistIcon: new L.Icon({
                iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
                shadowUrl: shadowUrl,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            }),
            visitedIcon: new L.Icon({
                iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
                shadowUrl: shadowUrl,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        };
    }, []);

    // --- LOGIC UTAMA: PARSING LOCATION ---
    const placesWithCoords = useMemo(() => {
        if (!Array.isArray(places)) return [];
        
        return places.map(p => {
            // 1. Coba parse dari field 'location' (hex string dari backend)
            const coords = parsePostGISPoint(p.location);

            if (coords) {
                return {
                    ...p,
                    lat: coords.lat,
                    lng: coords.lng,
                    isValid: true,
                    icon: (p.visits && p.visits.length > 0) ? visitedIcon : wishlistIcon,
                    status: (p.visits && p.visits.length > 0) ? "Sudah Dikunjungi" : "Wishlist"
                };
            }
            // 2. Fallback: Jika gagal parse, jangan tampilkan (isValid: false)
            return { ...p, isValid: false };
        }).filter(p => p.isValid);
    }, [places, visitedIcon, wishlistIcon]);

    return (
        <MapContainer center={defaultCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapUpdater center={defaultCenter} />

            {/* Marker User */}
            {userLocation && (
                <Marker position={[userLocation.lat, userLocation.long]}>
                    <Popup>Lokasi Kamu</Popup>
                </Marker>
            )}

            {/* Marker Places */}
            {placesWithCoords.map((place) => (
                <Marker 
                    key={place.id} 
                    position={[place.lat, place.lng]} 
                    icon={place.icon}
                >
                    <Popup className="custom-popup">
                        <div className="flex flex-col gap-2 min-w-[200px]">
                            <div className="w-full h-24 bg-gray-100 rounded-lg overflow-hidden">
                                <img 
                                    src={place.meta_image || place.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"} 
                                    alt={place.name} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";
                                    }}
                                />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-gray-800 line-clamp-2">{place.name}</h3>
                                <p className="text-[10px] text-gray-500 mb-1">
                                    {place.m_categories?.name || place.category} • {place.m_price_ranges?.label || place.price_level}
                                </p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold w-fit ${place.status === "Wishlist" ? "bg-red-50 text-red-500" : "bg-green-50 text-green-500"}`}>
                                    {place.status}
                                </span>
                            </div>
                            <Link href={`/wishlist/${place.id}`} className="w-full bg-primary-500 text-white text-xs font-bold py-2 rounded-lg text-center hover:bg-primary-600 transition">
                                Lihat Detail
                            </Link>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
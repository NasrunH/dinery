"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Place } from "@/types";
import Link from "next/link";
import { parsePostGISPoint } from "@/lib/wkbParser"; // Import parser baru
import { useAuth } from "@/context/AuthContext";

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
    const { user } = useAuth();

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

    // --- CUSTOM USER ICON WITH AVATAR / INITIALS ---
    const userIcon = useMemo(() => {
        if (typeof window === "undefined" || !L) return undefined;

        const avatarUrl = user?.avatar_url;
        const displayName = user?.display_name || "Kamu";
        const initials = displayName.charAt(0).toUpperCase();

        return L.divIcon({
            className: "bg-transparent border-none", // Hilangkan default styles dari leaflet div-icon
            html: `
                <div class="relative flex flex-col items-center justify-center fade-in" style="width: 50px; height: 60px;">
                    <!-- Pulse animation rings -->
                    <div class="absolute top-[5px] w-12 h-12 bg-primary-500/20 rounded-full animate-ping" style="animation-duration: 2s;"></div>
                    <div class="absolute top-[9px] w-10 h-10 bg-primary-500/35 rounded-full animate-pulse" style="animation-duration: 1.5s;"></div>
                    
                    <!-- Marker body (circular frame for avatar) -->
                    <div class="relative w-11 h-11 rounded-full border-[3px] border-white shadow-[0_4px_12px_rgba(244,63,94,0.4)] overflow-hidden flex items-center justify-center bg-primary-500 transition-all hover:scale-110 z-10">
                        ${avatarUrl ? `
                            <img src="${avatarUrl}" class="w-full h-full object-cover" alt="User Profile" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'text-white font-bold text-sm flex items-center justify-center w-full h-full bg-primary-500\\'>${initials}</div>';" />
                        ` : `
                            <div class="text-white font-bold text-base flex items-center justify-center bg-primary-500 w-full h-full">
                                ${initials}
                            </div>
                        `}
                    </div>
                    
                    <!-- Marker pin tail -->
                    <div class="absolute top-[44px] w-3 h-3 bg-white rotate-45 shadow-[2px_2px_4px_rgba(0,0,0,0.1)] z-0" style="border-right: 3px solid white; border-bottom: 3px solid white; border-radius: 0 0 2px 0;"></div>
                    
                    <!-- Inside the tail to fill color -->
                    <div class="absolute top-[42px] w-2 h-2 bg-primary-500 rotate-45 z-10" style="transform: rotate(45deg); margin-top: -1px; background-color: #f43f5e;"></div>
                </div>
            `,
            iconSize: [50, 60],
            iconAnchor: [25, 55],
            popupAnchor: [0, -50]
        });
    }, [user?.avatar_url, user?.display_name]);

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
                <Marker position={[userLocation.lat, userLocation.long]} icon={userIcon}>
                    <Popup>
                        <div className="text-center p-1">
                            <p className="font-bold text-gray-800 text-sm">Lokasi Kamu</p>
                            <p className="text-[10px] text-gray-500">{user?.display_name || "Kamu"}</p>
                        </div>
                    </Popup>
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
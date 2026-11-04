"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { parsePostGISPoint } from "@/lib/wkbParser";
import { useAuth } from "@/context/AuthContext";

// Helper Recenter dengan Leaflet map.setView() animasi smooth (tanpa reload browser)
function MapUpdater({ center, trigger }: { center: [number, number]; trigger?: number }) {
    const map = useMap();
    useEffect(() => {
        if (center && Array.isArray(center) && center.length === 2) {
            map.setView(center, Math.max(map.getZoom(), 14), { animate: true, duration: 1 });
        }
    }, [center, trigger, map]);
    return null;
}

interface MapComponentProps {
    places: any[];
    userLocation: { lat: number; long: number } | null;
    centerTarget?: [number, number] | null;
    centerTrigger?: number;
}

export default function MapComponent({ places, userLocation, centerTarget, centerTrigger }: MapComponentProps) {
    const { user } = useAuth();

    // Default Jakarta
    const defaultCenter: [number, number] = userLocation 
        ? [userLocation.lat, userLocation.long] 
        : [-6.2088, 106.8456];

    const activeCenter: [number, number] = centerTarget || defaultCenter;

    // --- INSTANT LOCAL SVG ICONS (0ms latency, zero external network dependency) ---
    const { wishlistIcon, visitedIcon } = useMemo(() => {
        if (typeof window === "undefined" || !L) {
            return { wishlistIcon: undefined as any, visitedIcon: undefined as any };
        }

        // Pin Merah: Wishlist (Belum dikunjungi)
        const wishlistIcon = L.divIcon({
            className: "bg-transparent border-none",
            html: `
                <div class="relative flex items-center justify-center filter drop-shadow-md transition-transform hover:scale-110" style="width: 32px; height: 40px;">
                    <svg viewBox="0 0 24 32" width="32" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20c0-6.63-5.37-12-12-12z" fill="#f43f5e"/>
                        <circle cx="12" cy="11" r="5" fill="white"/>
                        <path d="M12 8.5v5M9.5 11h5" stroke="#f43f5e" stroke-width="1.8" stroke-linecap="round"/>
                    </svg>
                </div>
            `,
            iconSize: [32, 40],
            iconAnchor: [16, 40],
            popupAnchor: [0, -36]
        });

        // Pin Hijau: Visited (Sudah dikunjungi)
        const visitedIcon = L.divIcon({
            className: "bg-transparent border-none",
            html: `
                <div class="relative flex items-center justify-center filter drop-shadow-md transition-transform hover:scale-110" style="width: 32px; height: 40px;">
                    <svg viewBox="0 0 24 32" width="32" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20c0-6.63-5.37-12-12-12z" fill="#10b981"/>
                        <circle cx="12" cy="11" r="5" fill="white"/>
                        <path d="M9.5 11l1.8 1.8 3.5-3.5" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
            `,
            iconSize: [32, 40],
            iconAnchor: [16, 40],
            popupAnchor: [0, -36]
        });

        return { wishlistIcon, visitedIcon };
    }, []);

    // --- CUSTOM USER ICON WITH AVATAR / INITIALS ---
    const userIcon = useMemo(() => {
        if (typeof window === "undefined" || !L) return undefined;

        const avatarUrl = user?.avatar_url;
        const displayName = user?.display_name || "Kamu";
        const initials = displayName.charAt(0).toUpperCase();

        return L.divIcon({
            className: "bg-transparent border-none",
            html: `
                <div class="relative flex flex-col items-center justify-center fade-in" style="width: 50px; height: 60px;">
                    <div class="absolute top-[5px] w-12 h-12 bg-primary-500/20 rounded-full animate-ping" style="animation-duration: 2s;"></div>
                    <div class="absolute top-[9px] w-10 h-10 bg-primary-500/35 rounded-full animate-pulse" style="animation-duration: 1.5s;"></div>
                    
                    <div class="relative w-11 h-11 rounded-full border-[3px] border-white shadow-[0_4px_12px_rgba(244,63,94,0.4)] overflow-hidden flex items-center justify-center bg-primary-500 transition-all hover:scale-110 z-10">
                        ${avatarUrl ? `
                            <img src="${avatarUrl}" class="w-full h-full object-cover" alt="User Profile" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'text-white font-bold text-sm flex items-center justify-center w-full h-full bg-primary-500\\'>${initials}</div>';" />
                        ` : `
                            <div class="text-white font-bold text-base flex items-center justify-center bg-primary-500 w-full h-full">
                                ${initials}
                            </div>
                        `}
                    </div>
                    
                    <div class="absolute top-[44px] w-3 h-3 bg-white rotate-45 shadow-[2px_2px_4px_rgba(0,0,0,0.1)] z-0" style="border-right: 3px solid white; border-bottom: 3px solid white; border-radius: 0 0 2px 0;"></div>
                    <div class="absolute top-[42px] w-2 h-2 bg-primary-500 rotate-45 z-10" style="transform: rotate(45deg); margin-top: -1px; background-color: #f43f5e;"></div>
                </div>
            `,
            iconSize: [50, 60],
            iconAnchor: [25, 55],
            popupAnchor: [0, -50]
        });
    }, [user?.avatar_url, user?.display_name]);

    // --- LOGIC UTAMA: PARSING LOCATION & PENENTUAN STATUS AKURAT ---
    const placesWithCoords = useMemo(() => {
        if (!Array.isArray(places)) return [];
        
        return places.map(p => {
            const coords = parsePostGISPoint(p.location);

            if (coords) {
                // Status akurat: diperiksa dari visits array, flag is_visited, maupun status string
                const hasVisited = Boolean(
                    (Array.isArray(p.visits) && p.visits.length > 0) || 
                    p.is_visited || 
                    p.status === "Sudah Dikunjungi"
                );

                return {
                    ...p,
                    lat: coords.lat,
                    lng: coords.lng,
                    isValid: true,
                    icon: hasVisited ? visitedIcon : wishlistIcon,
                    status: hasVisited ? "Sudah Dikunjungi" : "Wishlist"
                };
            }
            return { ...p, isValid: false };
        }).filter(p => p.isValid);
    }, [places, visitedIcon, wishlistIcon]);

    return (
        <MapContainer center={defaultCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapUpdater center={activeCenter} trigger={centerTrigger} />
            
            {/* Marker Lokasi Pengguna */}
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

            {/* Marker Tempat Kuliner (Hijau = Dikunjungi, Merah = Wishlist) */}
            {placesWithCoords.map((place) => (
                <Marker 
                    key={place.id} 
                    position={[place.lat, place.lng]} 
                    icon={place.icon}
                >
                    <Popup className="custom-popup">
                        <div className="flex flex-col gap-2 min-w-[210px]">
                            <div className="w-full h-24 bg-gray-100 rounded-lg overflow-hidden">
                                <img 
                                    src={place.meta_image || place.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"} 
                                    alt={place.name} 
                                    loading="lazy"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";
                                    }}
                                />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-gray-800 line-clamp-2">{place.name}</h3>
                                <p className="text-[10px] text-gray-500 mb-1.5">
                                    {place.m_categories?.name || place.category || "Kuliner"} • {place.m_price_ranges?.label || place.price_level || "$"}
                                </p>
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold w-fit inline-block ${
                                    place.status === "Wishlist" 
                                        ? "bg-rose-50 text-rose-600 border border-rose-200" 
                                        : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                }`}>
                                    {place.status}
                                </span>
                            </div>
                            <Link 
                                href={`/wishlist/${place.id}`} 
                                className="w-full bg-primary-500 text-white text-xs font-bold py-2 rounded-lg text-center hover:bg-primary-600 transition"
                            >
                                Lihat Detail
                            </Link>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}

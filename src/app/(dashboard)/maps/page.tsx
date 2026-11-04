"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { fetchAPI } from "@/lib/api";
import { Loader2, Navigation } from "lucide-react";
import useSWR from "swr";

// Import Map Component secara dynamic (CSR only)
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-400 gap-2">
            <Loader2 className="animate-spin text-primary-500" />
            <span className="text-sm font-medium">Memuat Peta...</span>
        </div>
    )
});

export default function MapsPage() {
    const [userLocation, setUserLocation] = useState<{ lat: number; long: number } | null>(null);
    const [centerTarget, setCenterTarget] = useState<[number, number] | null>(null);

    // Ambil data places & visit history lewat SWR cache
    const { data: placesRes } = useSWR("/places?status=wishlist", fetchAPI);
    const { data: historyRes } = useSWR("/visits/history", fetchAPI);

    // Gabungkan data places dan history agar status dikunjungi (visits) akurat 100%
    const places = useMemo(() => {
        const rawPlaces: any[] = placesRes?.data || [];
        const visitedMap = new Map<number | string, any[]>();

        if (historyRes?.data && Array.isArray(historyRes.data)) {
            historyRes.data.forEach((hp: any) => {
                if (hp.id && Array.isArray(hp.visits)) {
                    visitedMap.set(hp.id, hp.visits);
                }
            });
        }

        return rawPlaces.map((p: any) => {
            const visits = (p.visits && p.visits.length > 0) ? p.visits : (visitedMap.get(p.id) || []);
            return {
                ...p,
                visits
            };
        });
    }, [placesRes, historyRes]);

    const { visitedCount, wishlistCount } = useMemo(() => {
        let visited = 0;
        let wishlist = 0;
        places.forEach(p => {
            if (p.visits && p.visits.length > 0) {
                visited++;
            } else {
                wishlist++;
            }
        });
        return { visitedCount: visited, wishlistCount: wishlist };
    }, [places]);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = {
                        lat: position.coords.latitude,
                        long: position.coords.longitude
                    };
                    setUserLocation(coords);
                    setCenterTarget([coords.lat, coords.long]);
                },
                () => console.log("Gagal ambil lokasi user, pakai default Jakarta")
            );
        }
    }, []);

    const handleRecenter = () => {
        if (userLocation) {
            // Trigger smooth pan di leaflet tanpa reload browser (array baru memicu re-render updater)
            setCenterTarget([userLocation.lat, userLocation.long]);
        }
    };

    return (
        <div className="h-screen w-full relative flex flex-col pb-20 bg-gray-50 dark:bg-gray-950">
            {/* Header Floating */}
            <div className="absolute top-6 left-6 right-6 z-[400] bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl px-5 py-3.5 rounded-[2rem] shadow-2xl shadow-black/10 border border-white/40 dark:border-gray-700/50 flex flex-wrap justify-between items-center gap-2 transition-all">
                <div>
                    <h1 className="font-extrabold text-gray-800 dark:text-gray-100 text-base md:text-lg tracking-tight">Peta Kuliner Kita 🗺️</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Menampilkan {places.length} titik lokasi tersimpan</p>
                </div>

                {/* Legend Status */}
                <div className="flex items-center gap-2 text-[11px] font-semibold">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse"></span>
                        Wishlist ({wishlistCount})
                    </span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                        Dikunjungi ({visitedCount})
                    </span>
                </div>
            </div>

            {/* Tombol Center Location (Halus tanpa reload) */}
            {userLocation && (
                <button 
                    onClick={handleRecenter}
                    className="absolute bottom-24 right-6 z-[400] p-4 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-full shadow-2xl shadow-blue-500/20 border border-gray-100 dark:border-gray-700 active:scale-95 transition-all hover:-translate-y-1"
                    title="Pusatkan ke Lokasi Saya"
                >
                    <Navigation size={24} fill="currentColor" className="opacity-20"/>
                    <Navigation size={24} className="absolute top-4 left-4"/>
                </button>
            )}

            {/* Map Container */}
            <div className="flex-1 w-full h-full bg-slate-100 dark:bg-gray-900">
                <MapComponent places={places} userLocation={userLocation} centerTarget={centerTarget} />
            </div>
        </div>
    );
}

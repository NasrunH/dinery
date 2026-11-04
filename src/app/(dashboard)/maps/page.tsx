"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { fetchAPI } from "@/lib/api";
import { Loader2, Navigation, Map as MapIcon } from "lucide-react";
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
    const [centerTrigger, setCenterTrigger] = useState<number>(0);

    // Ambil data places & visit history lewat SWR cache
    const { data: placesRes } = useSWR("/places?status=wishlist", fetchAPI);
    const { data: historyRes } = useSWR("/visits/history", fetchAPI);

    // Gabungkan data places dan history agar status dikunjungi (visits) akurat 100%
    const places = useMemo(() => {
        const rawPlaces: any[] = placesRes?.data || [];
        const visitedMap = new Map<string, any[]>();

        if (historyRes?.data && Array.isArray(historyRes.data)) {
            historyRes.data.forEach((hp: any) => {
                const visits = Array.isArray(hp.visits) ? hp.visits : [];
                if (hp.id && visits.length > 0) {
                    visitedMap.set(String(hp.id), visits);
                }
            });
        }

        return rawPlaces.map((p: any) => {
            const historyVisits = visitedMap.get(String(p.id)) || [];
            const directVisits = Array.isArray(p.visits) ? p.visits : [];
            const activeVisits = directVisits.length > 0 ? directVisits : historyVisits;
            const isVisited = activeVisits.length > 0;

            return {
                ...p,
                visits: activeVisits,
                is_visited: isVisited,
                status: isVisited ? "Sudah Dikunjungi" : "Wishlist"
            };
        });
    }, [placesRes, historyRes]);

    const { visitedCount, wishlistCount } = useMemo(() => {
        let visited = 0;
        let wishlist = 0;
        places.forEach(p => {
            if (p.is_visited) {
                visited++;
            } else {
                wishlist++;
            }
        });
        return { visitedCount: visited, wishlistCount: wishlist };
    }, [places]);

    // Ambil lokasi GPS awal pengguna
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
                    setCenterTrigger(prev => prev + 1);
                },
                () => console.log("Gagal ambil lokasi user, pakai default Jakarta")
            );
        }
    }, []);

    // Recenter tanpa reload browser dengan trigger animasi Leaflet map.setView()
    const handleRecenter = () => {
        if (userLocation) {
            setCenterTarget([userLocation.lat, userLocation.long]);
            setCenterTrigger(prev => prev + 1);
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = {
                        lat: position.coords.latitude,
                        long: position.coords.longitude
                    };
                    setUserLocation(coords);
                    setCenterTarget([coords.lat, coords.long]);
                    setCenterTrigger(prev => prev + 1);
                },
                () => console.log("Tidak dapat memperbarui GPS")
            );
        }
    };

    return (
        <div className="h-[calc(100dvh-4.25rem)] w-full relative flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
            {/* Header Floating (z-[999] agar selalu di atas layer Leaflet) */}
            <div className="absolute top-4 left-4 right-4 z-[999] bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-xl shadow-black/10 border border-white/40 dark:border-gray-700/60 flex flex-wrap justify-between items-center gap-2 transition-all">
                <div>
                    <h1 className="font-extrabold text-gray-800 dark:text-gray-100 text-sm md:text-base tracking-tight flex items-center gap-1.5">
                        <MapIcon size={18} className="text-primary-500 shrink-0" /> Peta Kuliner Kita
                    </h1>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Menampilkan {places.length} titik lokasi tersimpan</p>
                </div>

                {/* Legend Status Akurat */}
                <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-pulse"></span>
                        Wishlist ({wishlistCount})
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                        Dikunjungi ({visitedCount})
                    </span>
                </div>
            </div>

            {/* Tombol Center Location (z-[999], melayang pas di atas Bottom Navigation) */}
            {userLocation && (
                <button 
                    onClick={handleRecenter}
                    className="absolute bottom-5 right-4 z-[999] p-3.5 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-full shadow-2xl shadow-blue-500/25 border border-gray-100 dark:border-gray-700 active:scale-95 transition-all hover:-translate-y-0.5"
                    title="Pusatkan ke Lokasi Saya"
                >
                    <Navigation size={20} fill="currentColor" className="opacity-20"/>
                    <Navigation size={20} className="absolute top-3.5 left-3.5"/>
                </button>
            )}

            {/* Map Container */}
            <div className="flex-1 w-full h-full bg-slate-100 dark:bg-gray-900">
                <MapComponent 
                    places={places} 
                    userLocation={userLocation} 
                    centerTarget={centerTarget}
                    centerTrigger={centerTrigger}
                />
            </div>
        </div>
    );
}

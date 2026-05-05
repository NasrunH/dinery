"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { fetchAPI } from "@/lib/api";
import { Place } from "@/types";
import { Loader2, Navigation } from "lucide-react";

// Import Map Component secara dynamic (CSR only)
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400"><Loader2 className="animate-spin" /> Memuat Peta...</div>
});

export default function MapsPage() {
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState<{ lat: number; long: number } | null>(null);

    useEffect(() => {
        // 1. Get User Location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        long: position.coords.longitude
                    });
                },
                () => console.log("Gagal ambil lokasi user, pakai default Jakarta")
            );
        }

        // 2. Fetch All Places (Wishlist & Visited)
        const fetchPlaces = async () => {
            try {
                // Ambil wishlist & history sekaligus kalau bisa, atau gabungkan
                // Disini kita ambil wishlist dulu sebagai contoh
                const res = await fetchAPI("/places?status=wishlist"); 
                setPlaces(res.data || []);
            } catch (err) {
                console.error("Gagal load places", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPlaces();
    }, []);

    return (
        <div className="h-screen w-full relative flex flex-col pb-20"> {/* pb-20 untuk bottom nav */}
            
            {/* Header Floating */}
            <div className="absolute top-6 left-6 right-6 z-[400] bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl px-5 py-4 rounded-[2rem] shadow-2xl shadow-black/10 border border-white/30 dark:border-gray-700/50 flex justify-between items-center transition-all">
                <div>
                    <h1 className="font-extrabold text-gray-800 dark:text-gray-100 text-lg tracking-tight">Peta Kuliner Kita 🗺️</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Menampilkan {places.length} titik lokasi tersimpan</p>
                </div>
            </div>

            {/* Tombol Center Location */}
            {userLocation && (
                <button 
                    onClick={() => window.location.reload()} // Cara malas reset view, idealnya pass function ke MapComponent
                    className="absolute bottom-24 right-6 z-[400] p-4 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-full shadow-2xl shadow-blue-500/20 border border-gray-100 dark:border-gray-700 active:scale-95 transition-all hover:-translate-y-1"
                >
                    <Navigation size={24} fill="currentColor" className="opacity-20"/>
                    <Navigation size={24} className="absolute top-4 left-4"/>
                </button>
            )}

            {/* Map Container */}
            <div className="flex-1 w-full h-full bg-slate-100">
                <MapComponent places={places} userLocation={userLocation} />
            </div>
        </div>
    );
}
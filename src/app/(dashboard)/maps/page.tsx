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
            <div className="absolute top-4 left-4 right-4 z-[400] bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg border border-white/20">
                <h1 className="font-bold text-gray-800 text-sm">Peta Kuliner Kita 🗺️</h1>
                <p className="text-[10px] text-gray-500">Menampilkan {places.length} titik lokasi tersimpan</p>
            </div>

            {/* Tombol Center Location */}
            {userLocation && (
                <button 
                    onClick={() => window.location.reload()} // Cara malas reset view, idealnya pass function ke MapComponent
                    className="absolute bottom-24 right-4 z-[400] p-3 bg-white text-blue-600 rounded-full shadow-lg border border-gray-100 active:scale-95 transition"
                >
                    <Navigation size={20} fill="currentColor" className="opacity-20"/>
                    <Navigation size={20} className="absolute top-3 left-3"/>
                </button>
            )}

            {/* Map Container */}
            <div className="flex-1 w-full h-full bg-slate-100">
                <MapComponent places={places} userLocation={userLocation} />
            </div>
        </div>
    );
}
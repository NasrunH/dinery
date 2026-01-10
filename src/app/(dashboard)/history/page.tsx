"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { Star, Calendar, MapPin, ArrowRight } from "lucide-react";
import { Place } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";
import Link from "next/link"; // Import Link

export default function HistoryPage() {
  const [historyPlaces, setHistoryPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVisits = async () => {
      try {
        const res = await fetchAPI("/visits/history");
        
        // MAPPING JSON BARU
        // Struktur: Array of Places, di dalamnya ada array of 'visits'
        const mappedData = (res.data || []).map((item: any) => ({
            id: item.id.toString(),
            name: item.name,
            image_url: item.meta_image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
            category: item.m_categories?.name || "Umum",
            // Ambil data kunjungan terakhir (index 0 karena backend sorting desc)
            visits: item.visits || []
        }));

        setHistoryPlaces(mappedData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadVisits();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="bg-white px-6 py-6 rounded-b-3xl shadow-sm mb-6 sticky top-0 z-10">
            <h1 className="text-2xl font-bold text-gray-800">Kenangan Kita</h1>
            <p className="text-sm text-gray-500">Jejak petualangan kuliner bersama.</p>
        </div>

        <div className="px-6 pb-24 space-y-6">
            {loading ? (
                // Skeleton Loader
                [1,2,3].map(i => (
                    <div key={i} className="pl-8 border-l-2 border-gray-200">
                        <Skeleton className="h-40 w-full rounded-2xl" />
                    </div>
                ))
            ) : historyPlaces.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <p>Belum ada kenangan. Yuk check-in dulu!</p>
                </div>
            ) : historyPlaces.map((place) => {
                // Kita ambil visit pertama saja untuk timeline
                const visit = place.visits && place.visits[0];
                if (!visit) return null;

                return (
                    <div key={place.id} className="relative pl-8 border-l-2 border-primary-200 last:border-l-0 pb-2 group">
                        {/* Timeline Dot */}
                        <div className="absolute -left-[9px] top-0 w-4 h-4 bg-primary-500 rounded-full border-4 border-white shadow-sm group-hover:scale-110 transition-transform"></div>
                        
                        {/* WRAP DENGAN LINK AGAR BISA DIKLIK KE DETAIL */}
                        <Link href={`/wishlist/${place.id}`}>
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer">
                                {/* Header Card */}
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-lg leading-tight">{place.name}</h3>
                                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                            <MapPin size={10} /> {place.category}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg text-yellow-600 text-xs font-bold border border-yellow-100">
                                        <Star size={12} fill="currentColor" /> {visit.rating}
                                    </div>
                                </div>
                                
                                {/* Foto Kenangan (Jika ada foto yang diupload saat visit) */}
                                {visit.photo_urls && visit.photo_urls.length > 0 ? (
                                    <div className="h-40 w-full bg-gray-100 rounded-xl mb-3 overflow-hidden">
                                        <img src={visit.photo_urls[0]} alt="Foto Kenangan" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                ) : (
                                    // Jika tidak ada foto upload, pakai foto tempat (meta_image)
                                    <div className="h-32 w-full bg-gray-100 rounded-xl mb-3 overflow-hidden opacity-80 grayscale-[30%]">
                                        <img src={place.image_url} alt="Thumbnail Tempat" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                )}

                                {/* Review Text */}
                                {visit.review_text ? (
                                    <div className="bg-gray-50 p-3 rounded-xl mb-3">
                                        <p className="text-gray-600 text-sm italic line-clamp-2">"{visit.review_text}"</p>
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-xs italic mb-3">Tidak ada review tertulis.</p>
                                )}
                                
                                {/* Footer Date & CTA */}
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <Calendar size={12} />
                                        {new Date(visit.visit_date).toLocaleDateString('id-ID', { 
                                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                                        })}
                                    </div>
                                    <span className="text-xs text-primary-500 font-semibold flex items-center gap-1">
                                        Lihat Detail <ArrowRight size={12}/>
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </div>
                );
            })}
        </div>
    </div>
  );
}
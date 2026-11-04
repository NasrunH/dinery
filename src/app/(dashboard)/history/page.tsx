"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { Star, Calendar, MapPin, ArrowRight, Repeat } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import Link from "next/link";

interface HistoryVisitItem {
  visit_id: string | number;
  place_id: string;
  place_name: string;
  place_image: string;
  place_category: string;
  rating: number;
  review_text?: string;
  visit_date: string;
  repeat_order?: boolean;
  photo_urls?: string[];
}

export default function HistoryPage() {
  const [visitsList, setVisitsList] = useState<HistoryVisitItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVisits = async () => {
      try {
        const res = await fetchAPI("/visits/history");
        
        // Ratakan seluruh sesi kunjungan (visits) agar kunjungan berulang tidak hilang
        const allVisits: HistoryVisitItem[] = [];
        (res.data || []).forEach((item: any) => {
          const pId = item.id.toString();
          const pName = item.name;
          const pImage = item.meta_image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";
          const pCat = item.m_categories?.name || "Umum";

          (item.visits || []).forEach((v: any, vIdx: number) => {
            allVisits.push({
              visit_id: v.id || `${pId}-${vIdx}`,
              place_id: pId,
              place_name: pName,
              place_image: pImage,
              place_category: pCat,
              rating: v.rating,
              review_text: v.review_text,
              visit_date: v.visit_date,
              repeat_order: Boolean(v.repeat_order ?? v.is_repeat_order),
              photo_urls: v.photo_urls || []
            });
          });
        });

        // Urutkan seluruh sesi kunjungan dari tanggal paling baru
        allVisits.sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
        setVisitsList(allVisits);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadVisits();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
        <div className="bg-white dark:bg-gray-900 px-6 py-6 rounded-b-3xl shadow-sm mb-6 sticky top-0 z-10 transition-colors border-b border-transparent dark:border-gray-800">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Kenangan Kita</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Jejak petualangan kuliner bersama ({visitsList.length} kunjungan).</p>
        </div>

        <div className="px-6 pb-24 space-y-6">
            {loading ? (
                [1,2,3].map(i => (
                    <div key={i} className="pl-8 border-l-2 border-gray-200 dark:border-gray-800">
                        <Skeleton className="h-40 w-full rounded-2xl" />
                    </div>
                ))
            ) : visitsList.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <p>Belum ada kenangan. Yuk check-in dulu!</p>
                </div>
            ) : visitsList.map((item) => (
                <div key={item.visit_id} className="relative pl-8 border-l-2 border-primary-200 dark:border-primary-900/50 last:border-l-0 pb-2 group">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[9px] top-0 w-4 h-4 bg-primary-500 rounded-full border-4 border-white dark:border-gray-900 shadow-sm group-hover:scale-110 transition-transform"></div>
                    
                    <Link href={`/wishlist/${item.place_id}`}>
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all cursor-pointer">
                            {/* Header Card */}
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg leading-tight">{item.place_name}</h3>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-1">
                                        <MapPin size={10} /> {item.place_category}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {item.repeat_order && (
                                        <span className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-green-100 dark:border-green-800/50 flex items-center gap-0.5">
                                            <Repeat size={10} strokeWidth={2.5} /> Lagi
                                        </span>
                                    )}
                                    <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/30 px-2 py-1 rounded-lg text-yellow-600 dark:text-yellow-400 text-xs font-bold border border-yellow-100 dark:border-yellow-900/30">
                                        <Star size={12} fill="currentColor" /> {item.rating}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Foto Kenangan */}
                            {item.photo_urls && item.photo_urls.length > 0 ? (
                                <div className="h-40 w-full bg-gray-100 dark:bg-gray-800 rounded-xl mb-3 overflow-hidden">
                                    <img src={item.photo_urls[0]} alt="Foto Kenangan" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                            ) : (
                                <div className="h-32 w-full bg-gray-100 dark:bg-gray-800 rounded-xl mb-3 overflow-hidden opacity-80 grayscale-[20%]">
                                    <img src={item.place_image} alt="Thumbnail Tempat" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                            )}

                            {/* Review Text */}
                            {item.review_text ? (
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl mb-3">
                                    <p className="text-gray-600 dark:text-gray-300 text-sm italic line-clamp-2">"{item.review_text}"</p>
                                </div>
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500 text-xs italic mb-3">Tidak ada review tertulis.</p>
                            )}
                            
                            {/* Footer Date & CTA */}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 dark:border-gray-800">
                                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                                    <Calendar size={12} />
                                    {new Date(item.visit_date).toLocaleDateString('id-ID', { 
                                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                                    })}
                                </div>
                                <span className="text-xs text-primary-500 dark:text-primary-400 font-semibold flex items-center gap-1">
                                    Lihat Detail <ArrowRight size={12}/>
                                </span>
                            </div>
                        </div>
                    </Link>
                </div>
            ))}
        </div>
    </div>
  );
}

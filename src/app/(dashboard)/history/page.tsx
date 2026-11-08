"use client";

import { useMemo } from "react";
import { fetchAPI } from "@/lib/api";
import { Star, Calendar, MapPin, ArrowRight, Repeat, Sparkles, User as UserIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import useSWR from "swr";
import { placeCache } from "@/lib/placeCache";

interface HistoryVisitItem {
  visit_id: string | number;
  place_id: string;
  place_name: string;
  place_image: string;
  place_category: string;
  session_number?: number;
  total_sessions?: number;
  rating: number;
  review_text?: string;
  visit_date: string;
  repeat_order?: boolean;
  photo_urls?: string[];
  reviewer_name?: string;
  reviewer_avatar?: string;
}

export default function HistoryPage() {
  // Gunakan SWR untuk instant cache & auto revalidation
  const { data: historyRes, isLoading } = useSWR("/visits/history", fetchAPI);

  // Ratakan seluruh sesi kunjungan (visits) per-sesi secara kronologis
  const visitsList = useMemo(() => {
    const rawData: any[] = historyRes?.data || [];
    const allVisits: HistoryVisitItem[] = [];

    rawData.forEach((item: any) => {
      const pId = item.id.toString();
      const pName = item.name;
      const pImage = item.meta_image || item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";
      const pCat = item.m_categories?.name || item.category || "Umum";

      // Simpan ke cache agar buka detail dari riwayat instan 0 ms
      placeCache.set(pId, item);

      // Urutkan kunjungan tempat ini dari yang paling awal (ascending) untuk penomoran sesi
      const placeVisits = Array.isArray(item.visits) 
        ? [...item.visits].sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime())
        : [];
      
      const totalVisitsForPlace = placeVisits.length;

      placeVisits.forEach((v: any, idx: number) => {
        allVisits.push({
          visit_id: v.id || `${pId}-${v.visit_date}-${idx}`,
          place_id: pId,
          place_name: pName,
          place_image: pImage,
          place_category: pCat,
          session_number: totalVisitsForPlace > 1 ? (idx + 1) : undefined,
          total_sessions: totalVisitsForPlace,
          rating: v.rating,
          review_text: v.review_text,
          visit_date: v.visit_date,
          repeat_order: Boolean(v.repeat_order ?? v.is_repeat_order),
          photo_urls: v.photo_urls || [],
          reviewer_name: v.user?.display_name,
          reviewer_avatar: v.user?.avatar_url
        });
      });
    });

    // Urutkan seluruh sesi kunjungan dari tanggal paling baru (descending)
    return allVisits.sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
  }, [historyRes]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Header Sticky */}
      <div className="bg-white dark:bg-gray-900 px-6 py-6 rounded-b-3xl shadow-sm mb-6 sticky top-0 z-10 transition-colors border-b border-transparent dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          Kenangan Kita <Sparkles size={20} className="text-primary-500" />
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Jejak petualangan kuliner bersama ({visitsList.length} sesi kunjungan).
        </p>
      </div>

      <div className="px-6 pb-24 space-y-6 max-w-md mx-auto">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="pl-8 border-l-2 border-gray-200 dark:border-gray-800">
              <Skeleton className="h-44 w-full rounded-2xl" />
            </div>
          ))
        ) : visitsList.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500 space-y-3">
            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-950/40 rounded-full flex items-center justify-center mx-auto text-primary-500">
              <Calendar size={32} />
            </div>
            <p className="font-semibold text-gray-700 dark:text-gray-300">Belum ada kenangan tercatat.</p>
            <p className="text-xs">Yuk kunjungi tempat impianmu dan catat check-in pertama!</p>
            <Link 
              href="/wishlist" 
              className="inline-block mt-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-primary-500/20 hover:bg-primary-600 transition"
            >
              Buka Wishlist
            </Link>
          </div>
        ) : (
          visitsList.map((item) => (
            <div 
              key={item.visit_id} 
              className="relative pl-8 border-l-2 border-primary-200 dark:border-primary-900/50 last:border-l-0 pb-3 group"
            >
              {/* Timeline Dot */}
              <div className="absolute -left-[9px] top-1.5 w-4 h-4 bg-primary-500 rounded-full border-4 border-white dark:border-gray-900 shadow-sm group-hover:scale-125 transition-transform"></div>
              
              <Link 
                href={`/wishlist/${item.place_id}`}
                onClick={() => placeCache.set(item.place_id, {
                  id: item.place_id,
                  name: item.place_name,
                  image_url: item.place_image,
                  category: item.place_category,
                })}
              >
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all cursor-pointer">
                  
                  {/* Header Card */}
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base leading-tight">
                          {item.place_name}
                        </h3>
                        {item.session_number && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/40">
                            Kunjungan ke-{item.session_number}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <MapPin size={11} /> {item.place_category}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
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
                  
                  {/* Foto Kenangan Sesi Ini */}
                  {item.photo_urls && item.photo_urls.length > 0 ? (
                    <div className="h-40 w-full bg-gray-100 dark:bg-gray-800 rounded-xl mb-3 overflow-hidden">
                      <img 
                        src={item.photo_urls[0]} 
                        alt="Foto Kenangan" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div>
                  ) : (
                    <div className="h-32 w-full bg-gray-100 dark:bg-gray-800 rounded-xl mb-3 overflow-hidden opacity-80 grayscale-[20%]">
                      <img 
                        src={item.place_image} 
                        alt="Thumbnail Tempat" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div>
                  )}

                  {/* Review Text Sesi Ini */}
                  {item.review_text ? (
                    <div className="bg-gray-50 dark:bg-gray-800/70 p-3 rounded-xl mb-3">
                      <p className="text-gray-700 dark:text-gray-300 text-sm italic line-clamp-2">
                        "{item.review_text}"
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500 text-xs italic mb-3">Tidak ada review tertulis.</p>
                  )}
                  
                  {/* Footer: Reviewer & Tanggal */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500">
                    <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                      {item.reviewer_avatar ? (
                        <img src={item.reviewer_avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                      ) : (
                        <Calendar size={12} />
                      )}
                      <span>
                        {new Date(item.visit_date).toLocaleDateString("id-ID", { 
                          weekday: "short", day: "numeric", month: "short", year: "numeric" 
                        })}
                      </span>
                    </div>

                    <span className="text-xs text-primary-500 dark:text-primary-400 font-semibold flex items-center gap-1 shrink-0">
                      Detail <ArrowRight size={12}/>
                    </span>
                  </div>

                </div>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

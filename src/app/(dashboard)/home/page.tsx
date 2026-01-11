"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { 
  Bell, MapPin, Plus, Dice5, 
  AlertTriangle, ChevronRight, Heart, Utensils, History,
  Bookmark, FolderHeart
} from "lucide-react";
import Link from "next/link";
import { DashboardSummary } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";

export default function HomePage() {
  const { user } = useAuth();
  const [coupleName, setCoupleName] = useState("");
  
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initDashboard = async () => {
        try {
            const [coupleRes, summaryRes] = await Promise.all([
                fetchAPI("/couples/my-status"),
                fetchAPI("/dashboard/summary")
            ]);

            if (coupleRes.data) setCoupleName(coupleRes.data.name);
            else if (coupleRes.couple_data) setCoupleName(coupleRes.couple_data.name);

            if (summaryRes.status === "success") {
                setData(summaryRes.data);
            }
            
        } catch (e) { 
            console.error("Gagal load dashboard", e); 
        } finally {
            setLoading(false);
        }
    };
    initDashboard();
  }, []);

  const isProfileIncomplete = !user?.display_name || user.display_name === user.email;

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      
      {/* --- HEADER --- */}
      <div className="bg-white px-6 pt-8 pb-6 rounded-b-3xl shadow-sm z-10 relative">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <Link href="/profile">
                <div className="w-11 h-11 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold border-2 border-primary-50 overflow-hidden">
                    {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        user?.display_name?.charAt(0).toUpperCase() || "U"
                    )}
                </div>
            </Link>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Halo, {user?.display_name || 'Kak'}</p>
              <h2 className="text-lg font-bold text-gray-800 leading-none">
                {coupleName ? `Ruang ${coupleName}` : "Ruang Couple"}
              </h2>
              {/* GAMIFICATION BADGE */}
              {data?.insights?.couple_level && (
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-100 rounded-full">
                      <span className="text-[10px] font-bold text-green-700">{data.insights.couple_level}</span>
                  </div>
              )}
            </div>
          </div>
          
          <Link href="/notifications">
            <button className="p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition relative border border-gray-100 shadow-sm">
                {(data?.unread_notif || 0) > 0 && (
                    <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                )}
                <Bell size={20} className="text-gray-600" />
            </button>
          </Link>
        </div>

        {/* ALERT PROFIL */}
        {isProfileIncomplete && (
            <div className="mb-6 animate-in slide-in-from-top-2 duration-500">
                <Link href="/profile/edit">
                    <div className="bg-orange-50 border border-orange-100 p-3 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-orange-100 transition">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center shrink-0 text-orange-500">
                            <AlertTriangle size={16} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xs font-bold text-orange-800">Lengkapi Profilmu</h4>
                            <p className="text-[10px] text-orange-600 leading-tight">Biar dashboard makin personal.</p>
                        </div>
                        <ChevronRight size={16} className="text-orange-400"/>
                    </div>
                </Link>
            </div>
        )}

        {/* INSIGHT CARD (TOTAL PLACES) */}
        {data?.stats && (
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-5 text-white shadow-xl shadow-indigo-200/50 relative overflow-hidden mb-6">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <FolderHeart size={100} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                        <Bookmark size={16} className="text-yellow-300" fill="currentColor" />
                        <span className="text-xs font-medium text-indigo-100 uppercase tracking-wider">Koleksi Tempat</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-4">
                        <h1 className="text-3xl font-bold">
                            {data.stats.total_places || 0}
                        </h1>
                        <span className="text-sm font-medium text-indigo-200">tempat tersimpan</span>
                    </div>
                    
                    <div className="flex gap-2">
                        <Link href="/wishlist/add" className="flex-1 py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition flex items-center justify-center gap-1">
                            <Plus size={14} strokeWidth={3} /> Tambah
                        </Link>
                        <Link href="/wishlist" className="flex-1 py-2 bg-white/20 text-white rounded-xl text-xs font-bold backdrop-blur-sm hover:bg-white/30 transition flex items-center justify-center gap-1">
                            Lihat Semua
                        </Link>
                    </div>
                </div>
            </div>
        )}

        {/* SHORTCUTS (LINKED) */}
        <div className="grid grid-cols-4 gap-3">
            <Link href="/wishlist" className="aspect-square bg-gray-50 rounded-2xl flex flex-col items-center justify-center gap-1.5 border border-gray-100 shadow-sm active:scale-95 transition hover:bg-gray-100">
                <div className="p-2 bg-white rounded-full text-pink-500 shadow-sm"><Heart size={18} fill="currentColor" className="opacity-20"/></div>
                <span className="text-[10px] font-bold text-gray-600">Wishlist</span>
            </Link>
            
            {/* Langsung ke wishlist */}
            <Link href="/wishlist" className="aspect-square bg-gray-50 rounded-2xl flex flex-col items-center justify-center gap-1.5 border border-gray-100 shadow-sm active:scale-95 transition hover:bg-gray-100">
                <div className="p-2 bg-white rounded-full text-blue-500 shadow-sm"><MapPin size={18}/></div>
                <span className="text-[10px] font-bold text-gray-600">Terdekat</span>
            </Link>
            
            {/* Langsung ke wishlist */}
            <Link href="/wishlist" className="aspect-square bg-gray-50 rounded-2xl flex flex-col items-center justify-center gap-1.5 border border-gray-100 shadow-sm active:scale-95 transition hover:bg-gray-100">
                <div className="p-2 bg-white rounded-full text-purple-500 shadow-sm"><Dice5 size={18}/></div>
                <span className="text-[10px] font-bold text-gray-600">Gacha</span>
            </Link>

            <Link href="/history" className="aspect-square bg-gray-50 rounded-2xl flex flex-col items-center justify-center gap-1.5 border border-gray-100 shadow-sm active:scale-95 transition hover:bg-gray-100">
                <div className="p-2 bg-white rounded-full text-orange-500 shadow-sm"><History size={18}/></div>
                <span className="text-[10px] font-bold text-gray-600">Riwayat</span>
            </Link>
        </div>
      </div>

      {/* --- DASHBOARD CONTENT --- */}
      <div className="px-6 py-4 space-y-8">

        {/* 1. STATS OVERVIEW */}
        <div>
            <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
                Statistik Kita
            </h3>
            <div className="grid grid-cols-2 gap-3">
                {/* Perbaikan: Hapus h-24, ganti dengan min-h, dan pastikan konten z-10 */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[6rem] relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-3 opacity-5 pointer-events-none"><Heart size={60}/></div>
                    
                    <div className="relative z-10">
                        <div className="p-2 bg-pink-50 text-pink-500 rounded-lg w-fit mb-3">
                            <Heart size={18} fill="currentColor" />
                        </div>
                        <div>
                            <span className="text-2xl font-bold text-gray-800 block leading-none mb-1">{data?.stats.wishlist_count || 0}</span>
                            <p className="text-xs text-gray-500 font-medium">Belum Dicoba</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[6rem] relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-3 opacity-5 pointer-events-none"><Utensils size={60}/></div>
                    
                    <div className="relative z-10">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg w-fit mb-3">
                            <Utensils size={18} />
                        </div>
                        <div>
                            <span className="text-2xl font-bold text-gray-800 block leading-none mb-1">{data?.stats.visited_count || 0}</span>
                            <p className="text-xs text-gray-500 font-medium">Sudah Dikunjungi</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* 2. TOP CATEGORIES (INSIGHT) */}
        {data?.insights.top_categories && data.insights.top_categories.length > 0 && (
            <div>
                 <h3 className="font-bold text-gray-800 mb-3 text-sm">Paling Sering Dimakan</h3>
                 <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    {data.insights.top_categories.map((cat, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-500 w-6">#{idx+1}</span>
                            <div className="flex-1">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-semibold text-gray-700">{cat.name}</span>
                                    <span className="text-gray-400">{cat.count}x</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${idx === 0 ? 'bg-primary-500' : idx === 1 ? 'bg-primary-300' : 'bg-primary-200'}`} 
                                        style={{ width: `${(cat.count / data.stats.visited_count) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
        )}

        {/* 3. NEW WISHLISTS (HORIZONTAL SCROLL) */}
        {data?.recent.new_wishlists && data.recent.new_wishlists.length > 0 && (
            <div>
                 <div className="flex justify-between items-end mb-3">
                    <h3 className="font-bold text-gray-800 text-sm">Baru Ditambahkan</h3>
                    <Link href="/wishlist" className="text-[10px] text-primary-600 font-bold hover:underline">Lihat Semua</Link>
                 </div>
                 <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6 snap-x">
                    {data.recent.new_wishlists.map((item) => (
                        <Link href={`/wishlist/${item.id}`} key={item.id} className="snap-start shrink-0 w-36">
                            <div className="aspect-[4/3] rounded-xl bg-gray-100 overflow-hidden mb-2 relative group">
                                <img 
                                    src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"} 
                                    className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";
                                    }}
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition"></div>
                            </div>
                            <h4 className="font-bold text-xs text-gray-800 line-clamp-1">{item.name}</h4>
                            <p className="text-[10px] text-gray-400">Baru aja!</p>
                        </Link>
                    ))}
                 </div>
            </div>
        )}

        {/* 4. LAST VISITED */}
        {data?.recent.last_visited && (
            <div>
                 <h3 className="font-bold text-gray-800 mb-3 text-sm">Terakhir Dikunjungi</h3>
                 <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex gap-4 items-center">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                        <img 
                            src={data.recent.last_visited.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80"} 
                            alt={data.recent.last_visited.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80";
                            }}
                        />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{data.recent.last_visited.name}</h4>
                            <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{data.recent.last_visited.date}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                            {[1,2,3,4,5].map(star => (
                                <StarIcon key={star} filled={star <= (data.recent.last_visited!.rating || 0)} />
                            ))}
                        </div>
                    </div>
                 </div>
            </div>
        )}

      </div>
    </div>
  );
}

function DashboardSkeleton() {
    return (
        <div className="pb-24 min-h-screen bg-gray-50 px-6 pt-8 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-1">
                        <Skeleton className="w-20 h-3" />
                        <Skeleton className="w-32 h-4" />
                    </div>
                </div>
                <Skeleton className="w-10 h-10 rounded-xl" />
            </div>
            <Skeleton className="w-full h-40 rounded-3xl" />
            <div className="grid grid-cols-4 gap-3">
                {[1,2,3,4].map(i => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
            </div>
            <div className="space-y-2">
                <Skeleton className="w-32 h-4" />
                <div className="grid grid-cols-2 gap-3">
                     <Skeleton className="h-24 rounded-2xl" />
                     <Skeleton className="h-24 rounded-2xl" />
                </div>
            </div>
        </div>
    )
}

function StarIcon({ filled }: { filled: boolean }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill={filled ? "#F59E0B" : "none"} 
            stroke={filled ? "#F59E0B" : "#D1D5DB"} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="w-3 h-3"
        >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
    );
}
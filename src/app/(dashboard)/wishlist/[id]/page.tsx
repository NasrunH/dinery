"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, MapPin, ExternalLink, PlayCircle, 
  Trash2, CheckCircle, Share2, User, Quote, Star, Calendar, Repeat, Edit // Import Edit
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Place, Visit } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";
import CheckInModal from "@/components/modals/CheckInModal";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import Link from "next/link"; // Import Link
import ImageWithFallback from "@/components/ui/ImageWithFallback";

export default function DetailPlacePage() {
  const params = useParams();
  const router = useRouter();
  
  const [place, setPlace] = useState<Place | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // 1. Fetch Detail Tempat
        const placeRes = await fetchAPI(`/places/${params.id}`);
        const item = placeRes.data;

        if (!item) throw new Error("Data tidak ditemukan");

        // === MAPPING DATA LENGKAP ===
        const mappedPlace: Place = {
            id: item.id.toString(),
            name: item.name,
            image_url: item.meta_image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
            original_link: item.original_link,
            platform: item.platform,
            category: item.m_categories?.name || "Umum",
            category_icon: item.m_categories?.icon || "📍",
            price_level: item.m_price_ranges?.label || "$",
            price_description: item.m_price_ranges?.description,
            tags: item.tags || (item.place_tags || []).map((t: any) => t.m_tags),
            gmaps_link: item.maps_link,
            target_menu: item.target_menu,
            description: item.meta_title,
            created_by_name: item.created_by_user?.display_name
        };
        setPlace(mappedPlace);

        // 2. Cek History Kunjungan
        const historyRes = await fetchAPI("/visits/history");
        const historyPlaces: any[] = historyRes.data || [];
        const historyItem = historyPlaces.find((p: any) => p.id.toString() === params.id);
        
        if (historyItem && historyItem.visits && historyItem.visits.length > 0) {
            // Urutkan visit berdasarkan tanggal kunjungan terbaru (opsional tapi disarankan)
            const sortedVisits = [...historyItem.visits].sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
            setVisits(sortedVisits);
        }

      } catch (err) {
        console.error("Gagal load data:", err);
        toast.error("Gagal memuat data tempat.");
        router.replace("/wishlist");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
        loadData();
    }
  }, [params.id, router]);

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Hapus Wishlist?',
      text: "Yakin mau hapus tempat ini dari daftar keinginanmu?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#e5e7eb',
      cancelButtonText: '<span style="color: #374151">Batal</span>',
      confirmButtonText: 'Ya, Hapus!'
    });

    if (result.isConfirmed) {
      const loadingToast = toast.loading("Menghapus...");
      try {
        await fetchAPI(`/places/${params.id}`, { method: "DELETE" });
        toast.dismiss(loadingToast);
        toast.success("Berhasil dihapus!");
        router.replace("/wishlist");
      } catch(err) {
        toast.dismiss(loadingToast);
        toast.error("Gagal menghapus data.");
      }
    }
  };

  const handleShare = async () => {
    if (!place) return;
    const shareData = {
        title: `Makan di ${place.name} yuk!`,
        text: `Cek tempat ini deh: ${place.name} (${place.category}).`,
        url: window.location.href
    };
    if (navigator.share) {
        try { await navigator.share(shareData); } catch (err) { console.log("Cancelled"); }
    } else {
        try {
            await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
            toast.success("Link disalin!");
        } catch (err) { toast.error("Gagal menyalin link."); }
    }
  };

  if (loading) return <DetailSkeleton />;
  if (!place) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-28 relative">
      
      {/* --- HERO HEADER --- */}
      <div className="relative h-[50vh] w-full bg-gray-900">
        <ImageWithFallback 
            src={place.image_url} 
            alt={place.name} 
            fill
            className="object-cover opacity-80"
            sizes="100vw"
            priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/40 to-black/60"></div>

        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center text-white z-40 safe-top">
            <button onClick={() => router.back()} className="p-3 bg-white/10 backdrop-blur-xl rounded-full hover:bg-white/20 transition border border-white/20 shadow-lg">
                <ArrowLeft size={22} />
            </button>
            <div className="flex gap-3">
                {/* TOMBOL EDIT (BARU) */}
                <Link href={`/wishlist/${params.id}/edit`}>
                    <button className="p-3 bg-white/10 backdrop-blur-xl rounded-full hover:bg-white/20 transition border border-white/20 active:scale-95 text-white shadow-lg">
                        <Edit size={20} />
                    </button>
                </Link>

                <button onClick={handleDelete} className="p-3 bg-red-500/20 backdrop-blur-xl rounded-full hover:bg-red-500/40 text-red-200 transition border border-red-500/30 shadow-lg">
                    <Trash2 size={20} />
                </button>
                <button 
                    onClick={handleShare}
                    className="p-3 bg-white/10 backdrop-blur-xl rounded-full hover:bg-white/20 transition border border-white/20 active:scale-95 shadow-lg"
                >
                    <Share2 size={20} />
                </button>
            </div>
        </div>

        <div className="absolute bottom-6 left-0 w-full px-8 text-white z-10">
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-3 py-1.5 bg-white/20 backdrop-blur-xl border border-white/20 text-[11px] font-bold rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    {place.category_icon} {place.category}
                </span>
                <span className="px-3 py-1.5 bg-green-500/90 backdrop-blur-xl text-[11px] font-bold rounded-xl border border-green-400/50 shadow-sm">
                    {place.price_level}
                </span>
                {place.platform && (
                      <span className="px-3 py-1.5 bg-black/50 backdrop-blur-xl border border-white/10 text-[11px] font-bold rounded-xl shadow-sm">
                        Via {place.platform}
                      </span>
                )}
            </div>
            <h1 className="text-4xl font-extrabold leading-tight mb-3 drop-shadow-xl tracking-tight">{place.name}</h1>
            
            <div className="flex items-center gap-2 text-xs text-gray-200">
                <div className="bg-white/20 p-1.5 rounded-full border border-white/10 backdrop-blur-md">
                    <User size={12} />
                </div>
                <span>Oleh <strong className="text-white ml-0.5">{place.created_by_name || "Pasanganmu"}</strong></span>
            </div>
        </div>
      </div>

      {/* --- MAIN CONTENT CARD --- */}
      <div className="relative -mt-10 bg-gray-50 dark:bg-gray-900 rounded-t-[2.5rem] px-8 py-10 shadow-[0_-15px_40px_rgba(0,0,0,0.15)] min-h-[50vh] z-20">
        
        {/* Buttons (Maps/Video) */}
        <div className="flex gap-4 mb-10 -mt-14 relative z-30">
            {place.gmaps_link && (
                <a 
                    href={place.gmaps_link} 
                    target="_blank" 
                    className="flex-1 py-4 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 hover:-translate-y-1 transition-all"
                >
                    <MapPin size={18} /> Google Maps
                </a>
            )}
            {place.original_link && (
                <a 
                    href={place.original_link} 
                    target="_blank" 
                    className="flex-1 py-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 hover:-translate-y-1 transition-all"
                >
                    {place.platform === "TikTok" ? <PlayCircle size={18} className="text-primary-500"/> : <ExternalLink size={18} />}
                    {place.platform === "TikTok" ? "Tonton" : "Sumber"}
                </a>
            )}
        </div>

        {/* --- REVIEW SECTION --- */}
        {visits.length > 0 ? (
            <div className="mb-10 animate-in slide-in-from-bottom-5">
                <h3 className="font-extrabold text-gray-800 dark:text-gray-100 mb-4 text-xs tracking-widest uppercase text-primary-500 flex items-center gap-2">
                    <CheckCircle size={16} /> Pengalaman Kita
                </h3>
                
                <div className="flex flex-col gap-4">
                    {visits.map((visit, index) => (
                        <div key={visit.id || index} className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 border border-primary-100 dark:border-gray-700 shadow-xl shadow-primary-500/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary-50 dark:from-primary-900/20 to-transparent rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-center mb-5">
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            {[1,2,3,4,5].map(star => (
                                                <Star key={star} size={18} fill={star <= visit.rating ? "#f43f5e" : "#e5e7eb"} className={star <= visit.rating ? "text-primary-500" : "text-gray-200 dark:text-gray-600"} />
                                            ))}
                                        </div>
                                        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                            <Calendar size={12}/> {new Date(visit.visit_date).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                                        </span>
                                    </div>
                                    {visit.is_repeat_order && (
                                        <span className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-black px-3 py-1.5 rounded-full border border-green-100 dark:border-green-800/50 flex items-center gap-1 uppercase tracking-wider">
                                            <Repeat size={12} strokeWidth={3} /> Mau Lagi
                                        </span>
                                    )}
                                </div>

                                {visit.review_text && (
                                    <p className="text-gray-700 dark:text-gray-300 text-[15px] leading-relaxed italic mb-5 border-l-4 border-primary-200 dark:border-primary-500/30 pl-4 py-1">
                                        "{visit.review_text}"
                                    </p>
                                )}

                                {(visit.photo_urls && visit.photo_urls.length > 0) && (
                                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                        {visit.photo_urls.map((url, idx) => (
                                            <img 
                                                key={idx} 
                                                src={url} 
                                                className="w-16 h-16 rounded-lg object-cover border border-gray-100 shadow-sm"
                                                alt="Review" 
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            // --- INFO LAINNYA ---
            <>
                <div className="mb-10">
                    <h3 className="font-extrabold text-gray-800 dark:text-gray-100 mb-4 text-xs tracking-widest uppercase text-gray-400">Vibe & Suasana</h3>
                    <div className="flex flex-wrap gap-2.5">
                        {place.tags && place.tags.length > 0 ? place.tags.map((tag: any, idx: number) => {
                            const tagName = tag.name || tag.m_tags?.name;
                            const tagColor = tag.color || tag.m_tags?.color;
                            
                            return (
                                <span 
                                    key={idx} 
                                    className="px-4 py-2 rounded-full text-xs font-bold shadow-sm border"
                                    style={{ 
                                        backgroundColor: tagColor ? `${tagColor}15` : '#fff', 
                                        color: tagColor || '#4b5563',
                                        borderColor: tagColor ? `${tagColor}20` : '#e5e7eb'
                                    }}
                                >
                                    #{tagName}
                                </span>
                            )
                        }) : (
                            <span className="text-gray-400 text-sm italic">Belum ada tags</span>
                        )}
                    </div>
                </div>

                {place.target_menu && (
                    <div className="mb-10">
                        <h3 className="font-extrabold text-gray-800 dark:text-gray-100 mb-4 text-xs tracking-widest uppercase text-gray-400">Wajib Dipesan</h3>
                        <div className="p-5 bg-gradient-to-br from-peach-light/20 to-transparent dark:from-peach-light/5 rounded-3xl border border-peach-light/40 dark:border-gray-800 shadow-md flex items-center gap-4">
                            <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl text-primary-500 shadow-sm border border-gray-50 dark:border-gray-700">
                                <span className="text-2xl">🍽️</span>
                            </div>
                            <div>
                                <p className="text-gray-800 dark:text-gray-100 font-black text-lg">{place.target_menu}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Rekomendasi dari {place.created_by_name?.split(' ')[0]}</p>
                            </div>
                        </div>
                    </div>
                )}
            </>
        )}

        {/* Section: Description */}
        {place.description && (
            <div className="mb-10">
                <h3 className="font-extrabold text-gray-800 dark:text-gray-100 mb-4 text-xs tracking-widest uppercase text-gray-400">Catatan / Caption</h3>
                <div className="relative p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm text-gray-600 dark:text-gray-300 text-[15px] leading-relaxed italic overflow-hidden">
                    <Quote size={40} className="absolute top-4 left-4 text-gray-100 dark:text-gray-700 -z-0 opacity-50" />
                    <p className="relative z-10 whitespace-pre-wrap">{place.description}</p>
                </div>
            </div>
        )}
        
        {/* Price Detail */}
        <div className="mb-4 text-center mt-6">
            <p className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 inline-block px-4 py-2 rounded-full font-medium border border-gray-200 dark:border-gray-700 shadow-sm">
                Range Harga: {place.price_description || "Tidak ada info detail"}
            </p>
        </div>

      </div>

      {/* --- BOTTOM FLOATING ACTION --- */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 safe-bottom">
         {visits.length > 0 ? (
             <div className="max-w-md mx-auto flex gap-3">
                 <Button 
                    className="w-full h-14 rounded-2xl shadow-xl shadow-green-500/20 text-base bg-green-500 hover:bg-green-600" 
                    onClick={() => {
                        setIsCheckInOpen(true);
                    }}
                 >
                     <CheckCircle size={22} className="mr-2" /> Kunjungi Lagi / Review Baru
                 </Button>
             </div>
         ) : (
             <div className="max-w-md mx-auto">
                 <Button 
                    className="w-full h-14 rounded-2xl shadow-xl shadow-primary-500/30 text-base font-bold bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 active:scale-95 transition-all" 
                    onClick={() => setIsCheckInOpen(true)}
                 >
                     <CheckCircle size={22} className="mr-2" /> Tandai Sudah Dikunjungi
                 </Button>
             </div>
         )}
      </div>

      {/* --- MODAL CHECK-IN --- */}
      <CheckInModal 
        isOpen={isCheckInOpen} 
        onClose={() => setIsCheckInOpen(false)}
        placeId={place.id}
        placeName={place.name}
      />

    </div>
  );
}

function DetailSkeleton() {
    return (
        <div className="min-h-screen bg-white">
            <Skeleton className="h-[45vh] w-full rounded-none" />
            <div className="-mt-8 bg-gray-50 rounded-t-[2.5rem] px-6 py-8 relative z-10 space-y-6">
                <div className="flex gap-3 -mt-12">
                    <Skeleton className="h-12 flex-1 rounded-2xl bg-white" />
                    <Skeleton className="h-12 flex-1 rounded-2xl bg-white" />
                </div>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
        </div>
    )
}
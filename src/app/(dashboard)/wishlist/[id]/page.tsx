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

export default function DetailPlacePage() {
  const params = useParams();
  const router = useRouter();
  
  const [place, setPlace] = useState<Place | null>(null);
  const [existingVisit, setExistingVisit] = useState<Visit | null>(null);
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
            setExistingVisit(historyItem.visits[0]);
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
      <div className="relative h-[45vh] w-full bg-gray-900">
        <img 
            src={place.image_url} 
            alt={place.name} 
            className="w-full h-full object-cover opacity-90"
            onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80";
            }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-black/60"></div>

        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center text-white z-10 safe-top">
            <button onClick={() => router.back()} className="p-2.5 bg-black/20 backdrop-blur-md rounded-full hover:bg-black/40 transition border border-white/10">
                <ArrowLeft size={22} />
            </button>
            <div className="flex gap-3">
                {/* TOMBOL EDIT (BARU) */}
                <Link href={`/wishlist/${params.id}/edit`}>
                    <button className="p-2.5 bg-black/20 backdrop-blur-md rounded-full hover:bg-black/40 transition border border-white/10 active:scale-95 text-white">
                        <Edit size={20} />
                    </button>
                </Link>

                <button onClick={handleDelete} className="p-2.5 bg-red-500/20 backdrop-blur-md rounded-full hover:bg-red-500/40 text-red-200 transition border border-red-500/30">
                    <Trash2 size={20} />
                </button>
                <button 
                    onClick={handleShare}
                    className="p-2.5 bg-black/20 backdrop-blur-md rounded-full hover:bg-black/40 transition border border-white/10 active:scale-95"
                >
                    <Share2 size={20} />
                </button>
            </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-6 pb-12 text-white">
            <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md border border-white/10 text-[10px] font-bold rounded-lg uppercase tracking-wider flex items-center gap-1">
                    {place.category_icon} {place.category}
                </span>
                <span className="px-2.5 py-1 bg-green-500/80 backdrop-blur-md text-[10px] font-bold rounded-lg border border-green-400/50">
                    {place.price_level}
                </span>
                {place.platform && (
                      <span className="px-2.5 py-1 bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold rounded-lg">
                        Via {place.platform}
                      </span>
                )}
            </div>
            <h1 className="text-3xl font-bold leading-tight mb-2 drop-shadow-md">{place.name}</h1>
            
            <div className="flex items-center gap-2 text-xs text-gray-300">
                <div className="bg-white/20 p-1 rounded-full">
                    <User size={12} />
                </div>
                <span>Ditambahkan oleh <strong className="text-white">{place.created_by_name || "Pasanganmu"}</strong></span>
            </div>
        </div>
      </div>

      {/* --- MAIN CONTENT CARD --- */}
      <div className="relative -mt-8 bg-gray-50 rounded-t-[2.5rem] px-6 py-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] min-h-[50vh] z-10">
        
        {/* Buttons (Maps/Video) */}
        <div className="flex gap-3 mb-8 -mt-12">
            {place.gmaps_link && (
                <a 
                    href={place.gmaps_link} 
                    target="_blank" 
                    className="flex-1 py-3.5 bg-white text-blue-600 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/5 border border-blue-50 active:scale-95 transition"
                >
                    <MapPin size={18} className="text-blue-500" /> Buka Maps
                </a>
            )}
            {place.original_link && (
                <a 
                    href={place.original_link} 
                    target="_blank" 
                    className="flex-1 py-3.5 bg-white text-gray-800 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-gray-900/5 border border-gray-100 active:scale-95 transition"
                >
                    {place.platform === "TikTok" ? <PlayCircle size={18} className="text-black"/> : <ExternalLink size={18} />}
                    {place.platform === "TikTok" ? "Tonton Video" : "Lihat Sumber"}
                </a>
            )}
        </div>

        {/* --- REVIEW SECTION --- */}
        {existingVisit ? (
            <div className="mb-8 animate-in slide-in-from-bottom-5">
                <h3 className="font-bold text-gray-800 mb-3 text-sm tracking-wide uppercase text-primary-500 flex items-center gap-2">
                    <CheckCircle size={16} /> Sudah Dikunjungi
                </h3>
                
                <div className="bg-white rounded-3xl p-5 border border-primary-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary-50 to-transparent rounded-bl-full -mr-4 -mt-4"></div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-1 mb-1">
                                    {[1,2,3,4,5].map(star => (
                                        <Star key={star} size={16} fill={star <= existingVisit.rating ? "#f43f5e" : "#e5e7eb"} className={star <= existingVisit.rating ? "text-primary-500" : "text-gray-200"} />
                                    ))}
                                </div>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Calendar size={12}/> {new Date(existingVisit.visit_date).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                                </span>
                            </div>
                            {existingVisit.is_repeat_order && (
                                <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded-full border border-green-100 flex items-center gap-1">
                                    <Repeat size={10} /> Repeat Order
                                </span>
                            )}
                        </div>

                        {existingVisit.review_text && (
                            <p className="text-gray-700 text-sm italic mb-4 border-l-2 border-primary-200 pl-3">
                                "{existingVisit.review_text}"
                            </p>
                        )}

                        {(existingVisit.photo_urls && existingVisit.photo_urls.length > 0) && (
                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                {existingVisit.photo_urls.map((url, idx) => (
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
            </div>
        ) : (
            // --- INFO LAINNYA ---
            <>
                <div className="mb-8">
                    <h3 className="font-bold text-gray-800 mb-3 text-sm tracking-wide uppercase text-gray-400">Suasana</h3>
                    <div className="flex flex-wrap gap-2">
                        {place.tags && place.tags.length > 0 ? place.tags.map((tag: any, idx: number) => {
                            // Handle struktur tag yang mungkin berbeda (dari object m_tags atau langsung)
                            const tagName = tag.name || tag.m_tags?.name;
                            const tagColor = tag.color || tag.m_tags?.color;
                            
                            return (
                                <span 
                                    key={idx} 
                                    className="px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm border border-transparent"
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
                    <div className="mb-8">
                        <h3 className="font-bold text-gray-800 mb-3 text-sm tracking-wide uppercase text-gray-400">Wajib Pesan</h3>
                        <div className="p-4 bg-white rounded-2xl border border-peach-light/30 shadow-sm flex items-start gap-3">
                            <div className="p-2 bg-peach-light/20 rounded-lg text-primary-500">
                                <span className="text-lg">🍴</span>
                            </div>
                            <div>
                                <p className="text-gray-800 font-bold text-sm">{place.target_menu}</p>
                                <p className="text-xs text-gray-400 mt-0.5">Menu rekomendasi {place.created_by_name?.split(' ')[0]}</p>
                            </div>
                        </div>
                    </div>
                )}
            </>
        )}

        {/* Section: Description */}
        {place.description && (
            <div className="mb-8">
                <h3 className="font-bold text-gray-800 mb-3 text-sm tracking-wide uppercase text-gray-400">Catatan / Caption</h3>
                <div className="relative p-5 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-600 text-sm leading-relaxed italic">
                    <Quote size={20} className="absolute top-4 left-4 text-gray-200 -z-0" />
                    <p className="relative z-10 whitespace-pre-wrap">{place.description}</p>
                </div>
            </div>
        )}
        
        {/* Price Detail */}
        <div className="mb-4 text-center">
            <p className="text-xs text-gray-400 bg-gray-100 inline-block px-3 py-1 rounded-full">
                Range Harga: {place.price_description || "Tidak ada info detail"}
            </p>
        </div>

      </div>

      {/* --- BOTTOM FLOATING ACTION --- */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 safe-bottom">
         {existingVisit ? (
             <div className="max-w-md mx-auto">
                 <Button 
                    className="w-full h-14 rounded-2xl shadow-xl shadow-green-500/20 text-base bg-green-500 hover:bg-green-600" 
                    onClick={() => toast.success("Tenang, reviewmu aman tersimpan!")}
                 >
                     <CheckCircle size={22} className="mr-2" /> Review Tersimpan
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
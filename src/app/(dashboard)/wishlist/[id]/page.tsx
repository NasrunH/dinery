"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchAPI } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, MapPin, ExternalLink, PlayCircle, 
  Trash2, CheckCircle, Share2, User, Quote, Star, 
  Calendar, Repeat, Edit, Copy, Compass, Utensils,
  Sparkles, Clock, HeartHandshake, Check
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Place, Visit } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";
import CheckInModal from "@/components/modals/CheckInModal";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import Link from "next/link";
import ImageWithFallback from "@/components/ui/ImageWithFallback";

export default function DetailPlacePage() {
  const params = useParams();
  const router = useRouter();
  
  const [place, setPlace] = useState<Place | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isAddressCopied, setIsAddressCopied] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Detail Tempat (Backend sudah menyertakan visits dan tags lengkap)
      const placeRes = await fetchAPI(`/places/${params.id}`);
      const item = placeRes?.data;

      if (!item) throw new Error("Data tidak ditemukan");

      // === MAPPING DATA LENGKAP & DETAIL ===
      const mappedPlace: Place = {
          id: item.id.toString(),
          name: item.name,
          image_url: item.meta_image || item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
          original_link: item.original_link,
          platform: item.platform,
          category: item.m_categories?.name || "Kuliner",
          category_icon: item.m_categories?.icon || "🍽️",
          price_level: item.m_price_ranges?.label || "$$",
          price_description: item.m_price_ranges?.description || "Harga terjangkau",
          tags: item.tags || (item.place_tags || []).map((t: any) => t.m_tags) || [],
          gmaps_link: item.maps_link,
          address_text: item.address_text || "",
          target_menu: item.target_menu || "",
          description: item.meta_title || "",
          created_by_name: item.created_by_user?.display_name || "Pasanganmu",
          created_at: item.created_at
      };
      setPlace(mappedPlace);

      // 2. Ambil data visits langsung dari payload
      if (item.visits && Array.isArray(item.visits) && item.visits.length > 0) {
          const mappedVisits = item.visits.map((v: any) => ({
              ...v,
              repeat_order: Boolean(v.repeat_order ?? v.is_repeat_order),
              is_repeat_order: Boolean(v.repeat_order ?? v.is_repeat_order),
              reviewer_name: v.user?.display_name,
              reviewer_avatar: v.user?.avatar_url
          }));
          const sortedVisits = [...mappedVisits].sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
          setVisits(sortedVisits);
      } else {
          setVisits([]);
      }

    } catch (err) {
      console.error("Gagal load data:", err);
      toast.error("Gagal memuat data tempat.");
      router.replace("/wishlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
        loadData();
    }
  }, [params.id]);

  // Hitung rata-rata rating jika sudah ada kunjungan
  const averageRating = useMemo(() => {
    if (visits.length === 0) return 0;
    const total = visits.reduce((acc, curr) => acc + (curr.rating || 0), 0);
    return (total / visits.length).toFixed(1);
  }, [visits]);

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Hapus Tempat?',
      text: "Tempat ini beserta seluruh riwayat kunjungannya akan dihapus.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#9ca3af',
      cancelButtonText: 'Batal',
      confirmButtonText: 'Ya, Hapus!',
      background: document.documentElement.classList.contains('dark') ? '#111827' : '#ffffff',
      color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
    });

    if (result.isConfirmed) {
      const loadingToast = toast.loading("Menghapus data...");
      try {
        await fetchAPI(`/places/${params.id}`, { method: "DELETE" });
        toast.dismiss(loadingToast);
        toast.success("Tempat berhasil dihapus!");
        router.replace("/wishlist");
      } catch (err: any) {
        toast.dismiss(loadingToast);
        toast.error(err.message || "Gagal menghapus data.");
      }
    }
  };

  const handleShare = async () => {
    if (!place) return;
    const shareText = `Yuk makan di "${place.name}" (${place.category})!\n${place.address_text ? `Alamat: ${place.address_text}\n` : ''}${window.location.href}`;
    
    if (navigator.share) {
        try { 
          await navigator.share({
            title: `Rekomendasi Kuliner: ${place.name}`,
            text: shareText,
            url: window.location.href
          }); 
        } catch { 
          /* User cancelled */
        }
    } else {
        try {
            await navigator.clipboard.writeText(shareText);
            toast.success("Info tempat berhasil disalin ke clipboard!");
        } catch { 
          toast.error("Gagal menyalin link."); 
        }
    }
  };

  const handleCopyAddress = () => {
    if (!place?.address_text) return;
    navigator.clipboard.writeText(place.address_text);
    setIsAddressCopied(true);
    toast.success("Alamat lengkap disalin!");
    setTimeout(() => setIsAddressCopied(false), 2000);
  };

  if (loading) return <DetailSkeleton />;
  if (!place) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-32 relative transition-colors max-w-md mx-auto">
      
      {/* --- HERO BANNER & FOTO UTAMA --- */}
      <div className="relative h-[48vh] w-full bg-gray-900 overflow-hidden">
        <ImageWithFallback 
            src={place.image_url} 
            alt={place.name} 
            fill
            className="object-cover opacity-85 hover:scale-105 transition-transform duration-700"
            sizes="100vw"
            priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-black/70"></div>

        {/* Top Floating Action Buttons */}
        <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-center text-white z-40 safe-top">
            <button 
              onClick={() => router.back()} 
              className="p-3 bg-black/40 backdrop-blur-xl rounded-full hover:bg-black/60 transition border border-white/20 shadow-lg active:scale-95 text-white"
              title="Kembali"
            >
                <ArrowLeft size={20} />
            </button>

            <div className="flex gap-2.5">
                <Link href={`/wishlist/${params.id}/edit`}>
                    <button 
                      className="p-3 bg-black/40 backdrop-blur-xl rounded-full hover:bg-black/60 transition border border-white/20 active:scale-95 text-white shadow-lg"
                      title="Edit Tempat"
                    >
                        <Edit size={18} />
                    </button>
                </Link>

                <button 
                  onClick={handleDelete} 
                  className="p-3 bg-rose-500/30 backdrop-blur-xl rounded-full hover:bg-rose-500/50 text-rose-200 transition border border-rose-500/40 shadow-lg active:scale-95"
                  title="Hapus Tempat"
                >
                    <Trash2 size={18} />
                </button>

                <button 
                    onClick={handleShare}
                    className="p-3 bg-black/40 backdrop-blur-xl rounded-full hover:bg-black/60 transition border border-white/20 active:scale-95 shadow-lg text-white"
                    title="Bagikan"
                >
                    <Share2 size={18} />
                </button>
            </div>
        </div>

        {/* Hero Title & Status Badges */}
        <div className="absolute bottom-7 left-0 w-full px-6 text-white z-10">
            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-xl border border-white/25 text-[11px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    <span>{place.category_icon}</span> {place.category}
                </span>

                <span className="px-3 py-1 bg-amber-500/90 backdrop-blur-xl text-white text-[11px] font-black rounded-full border border-amber-400/50 shadow-sm">
                    {place.price_level}
                </span>

                {visits.length > 0 ? (
                  <span className="px-3 py-1 bg-emerald-500/90 backdrop-blur-xl text-white text-[11px] font-bold rounded-full border border-emerald-400/50 shadow-sm flex items-center gap-1">
                    <CheckCircle size={12} /> Sudah Dikunjungi ({visits.length}x)
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-rose-500/80 backdrop-blur-xl text-white text-[11px] font-bold rounded-full border border-rose-400/40 shadow-sm flex items-center gap-1">
                    <Sparkles size={12} /> Wishlist Impian
                  </span>
                )}

                {place.platform && (
                  <span className="px-3 py-1 bg-black/60 backdrop-blur-xl border border-white/15 text-[10px] font-semibold rounded-full">
                    {place.platform}
                  </span>
                )}
            </div>

            <h1 className="text-3xl font-black leading-tight mb-2 drop-shadow-2xl tracking-tight text-white">
              {place.name}
            </h1>
            
            <div className="flex items-center gap-3 text-xs text-gray-300 flex-wrap">
                <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center text-[10px] font-bold">
                        <User size={12} />
                    </div>
                    <span>Oleh <strong className="text-white">{place.created_by_name}</strong></span>
                </div>

                {place.created_at && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-300/80">
                    <Clock size={11} /> {new Date(place.created_at).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                  </span>
                )}
            </div>
        </div>
      </div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="relative -mt-6 bg-white dark:bg-gray-900 rounded-t-[2.5rem] px-6 pt-7 pb-10 shadow-[0_-12px_40px_rgba(0,0,0,0.12)] min-h-[50vh] z-20 space-y-6 transition-colors">
        
        {/* --- QUICK ACTION BUTTONS --- */}
        <div className="grid grid-cols-2 gap-3 -mt-12 relative z-30">
            {place.gmaps_link ? (
                <a 
                    href={place.gmaps_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="py-3.5 px-4 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-500/10 border border-gray-100 dark:border-gray-700 hover:-translate-y-0.5 active:scale-95 transition-all"
                >
                    <Compass size={18} className="text-blue-500 animate-spin-slow" /> Rute Google Maps
                </a>
            ) : (
                <div className="py-3.5 px-4 bg-gray-50 dark:bg-gray-800/50 text-gray-400 rounded-2xl font-medium text-xs flex items-center justify-center gap-1 border border-gray-100 dark:border-gray-800">
                    <MapPin size={16} /> Tanpa Link Maps
                </div>
            )}

            {place.original_link ? (
                <a 
                    href={place.original_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="py-3.5 px-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-black/5 border border-gray-100 dark:border-gray-700 hover:-translate-y-0.5 active:scale-95 transition-all"
                >
                    {place.platform === "TikTok" ? (
                      <PlayCircle size={18} className="text-primary-500" />
                    ) : (
                      <ExternalLink size={18} className="text-gray-500 dark:text-gray-400" />
                    )}
                    {place.platform === "TikTok" ? "Lihat Video" : "Buka Sumber"}
                </a>
            ) : (
                <button 
                  onClick={handleShare}
                  className="py-3.5 px-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-black/5 border border-gray-100 dark:border-gray-700 hover:-translate-y-0.5 active:scale-95 transition-all"
                >
                  <Share2 size={16} className="text-primary-500" /> Bagikan Tempat
                </button>
            )}
        </div>

        {/* --- 1. CARD ALAMAT DETAIL & LOKASI (Selalu Tampil) --- */}
        <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-transparent dark:from-blue-950/20 dark:via-gray-800/40 dark:to-transparent p-5 rounded-3xl border border-blue-100/80 dark:border-blue-900/40 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-500 text-white rounded-xl shadow-md shadow-blue-500/20">
                        <MapPin size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Alamat Lengkap & Lokasi</h3>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Patokan rute kencan kita</p>
                    </div>
                </div>

                {place.address_text && (
                    <button 
                        onClick={handleCopyAddress}
                        className="px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold border border-blue-200 dark:border-blue-800/60 transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                        title="Salin Alamat"
                    >
                        {isAddressCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        <span>{isAddressCopied ? "Tersalin" : "Salin"}</span>
                    </button>
                )}
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 p-4 rounded-2xl border border-blue-50 dark:border-gray-700/60 backdrop-blur-sm">
                {place.address_text ? (
                    <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed font-medium">
                        {place.address_text}
                    </p>
                ) : (
                    <div className="text-xs text-gray-400 dark:text-gray-500 italic flex items-center justify-between">
                        <span>Belum ada catatan alamat terperinci.</span>
                        <Link 
                            href={`/wishlist/${params.id}/edit`}
                            className="text-primary-500 font-semibold not-italic hover:underline ml-2"
                        >
                            + Tambah Alamat
                        </Link>
                    </div>
                )}
            </div>

            {place.gmaps_link && (
                <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-gray-500 dark:text-gray-400 text-[11px]">Koordinat terhubung ke Google Maps</span>
                    <a 
                        href={place.gmaps_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                    >
                        Buka Navigasi GPS &rarr;
                    </a>
                </div>
            )}
        </div>

        {/* --- 2. CARD WAJIB COBA / TARGET MENU (Selalu Tampil) --- */}
        {place.target_menu ? (
            <div className="p-5 bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-transparent dark:from-amber-950/20 dark:via-gray-800/40 dark:to-transparent rounded-3xl border border-amber-100/80 dark:border-amber-900/40 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-md shadow-amber-500/20 shrink-0">
                    <Utensils size={22} />
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                            Menu Incaran / Wajib Coba
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">Rekomendasi</span>
                    </div>
                    <p className="text-gray-900 dark:text-gray-100 font-extrabold text-lg leading-snug">
                        {place.target_menu}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                        Disimpan khusus oleh {place.created_by_name?.split(' ')[0]}
                    </p>
                </div>
            </div>
        ) : null}

        {/* --- 3. HARGA & KATEGORI HIGHLIGHT --- */}
        <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/70 rounded-2xl border border-gray-100 dark:border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
                    Estimasi Harga
                </span>
                <p className="text-base font-black text-green-600 dark:text-green-400">
                    {place.price_level}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {place.price_description || "Standar kencan"}
                </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/70 rounded-2xl border border-gray-100 dark:border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
                    Kategori & Suasana
                </span>
                <p className="text-base font-black text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                    <span>{place.category_icon}</span> {place.category}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {visits.length > 0 ? `Rating Rata-rata ${averageRating} ⭐` : "Belum di-review"}
                </p>
            </div>
        </div>

        {/* --- 4. VIBE & SUASANA (TAGS) --- */}
        {place.tags && place.tags.length > 0 && (
            <div className="space-y-2.5">
                <h3 className="font-extrabold text-gray-800 dark:text-gray-100 text-xs tracking-widest uppercase text-gray-400">
                    Vibe & Suasana
                </h3>
                <div className="flex flex-wrap gap-2">
                    {place.tags.map((tag: any, idx: number) => {
                        const tagName = tag.name || tag.m_tags?.name || "Tag";
                        const tagColor = tag.color || tag.m_tags?.color || "#ec4899";
                        
                        return (
                            <span 
                                key={idx} 
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm border transition-all"
                                style={{ 
                                    backgroundColor: `${tagColor}15`, 
                                    color: tagColor,
                                    borderColor: `${tagColor}30`
                                }}
                            >
                                #{tagName}
                            </span>
                        );
                    })}
                </div>
            </div>
        )}

        {/* --- 5. CATATAN / CAPTION DARI REFERENSI --- */}
        {place.description && (
            <div className="space-y-2.5">
                <h3 className="font-extrabold text-gray-800 dark:text-gray-100 text-xs tracking-widest uppercase text-gray-400">
                    Catatan Referensi / Caption
                </h3>
                <div className="relative p-5 bg-gray-50 dark:bg-gray-800/80 rounded-3xl border border-gray-100 dark:border-gray-700/70 shadow-sm text-gray-700 dark:text-gray-300 text-sm leading-relaxed italic overflow-hidden">
                    <Quote size={36} className="absolute top-3 left-3 text-gray-200 dark:text-gray-700/40 -z-0 opacity-50" />
                    <p className="relative z-10 whitespace-pre-wrap">{place.description}</p>
                </div>
            </div>
        )}

        {/* --- 6. PENGALAMAN KITA (TIMELINE ULASAN & FOTO) --- */}
        <div className="pt-2">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-gray-800 dark:text-gray-100 text-xs tracking-widest uppercase text-primary-500 flex items-center gap-1.5">
                    <CheckCircle size={16} /> Pengalaman Kita ({visits.length} Sesi Kunjungan)
                </h3>
                {visits.length > 0 && (
                    <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/40 px-2.5 py-0.5 rounded-full border border-yellow-200 dark:border-yellow-900/40">
                        <Star size={12} fill="currentColor" /> {averageRating} / 5.0
                    </span>
                )}
            </div>
            
            {visits.length > 0 ? (
                <div className="flex flex-col gap-4">
                    {visits.map((visit, index) => (
                        <div 
                          key={visit.id || index} 
                          className="bg-white dark:bg-gray-800/90 rounded-[2rem] p-5 border border-primary-100/80 dark:border-gray-700/80 shadow-md shadow-primary-500/5 relative overflow-hidden space-y-3"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary-50/60 dark:from-primary-900/20 to-transparent rounded-bl-full pointer-events-none"></div>
                            
                            {/* Header Visit Card */}
                            <div className="flex justify-between items-start gap-2 relative z-10">
                                <div>
                                    <div className="flex items-center gap-1 mb-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star 
                                              key={star} 
                                              size={16} 
                                              fill={star <= visit.rating ? "#f43f5e" : "#e5e7eb"} 
                                              className={star <= visit.rating ? "text-primary-500" : "text-gray-200 dark:text-gray-600"} 
                                            />
                                        ))}
                                    </div>
                                    <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                        <Calendar size={12}/> {new Date(visit.visit_date).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                    {visit.repeat_order && (
                                        <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-1 uppercase tracking-wider">
                                            <Repeat size={11} strokeWidth={2.5} /> Mau Lagi
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Review Text */}
                            {visit.review_text && (
                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed italic border-l-4 border-primary-300 dark:border-primary-500/50 pl-3.5 py-1 bg-gray-50/50 dark:bg-gray-800/40 rounded-r-xl">
                                    "{visit.review_text}"
                                </p>
                            )}

                            {/* Foto-foto Sesi Ini */}
                            {visit.photo_urls && visit.photo_urls.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Foto Kenangan</span>
                                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                        {visit.photo_urls.map((url, idx) => (
                                            <div key={idx} className="w-20 h-20 shrink-0 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
                                                <img 
                                                    src={url} 
                                                    className="w-full h-full object-cover hover:scale-105 transition-transform" 
                                                    alt="Foto kunjungan" 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Reviewer signature */}
                            {visit.reviewer_name && (
                              <div className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1.5 pt-1 border-t border-gray-50 dark:border-gray-800">
                                {visit.reviewer_avatar ? (
                                  <img src={visit.reviewer_avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                                ) : (
                                  <User size={12} />
                                )}
                                <span>Check-in oleh {visit.reviewer_name}</span>
                              </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 px-6 bg-gradient-to-br from-primary-50/40 via-peach-light/20 to-transparent dark:from-primary-950/10 dark:via-gray-800/30 dark:to-transparent rounded-3xl border border-dashed border-primary-200 dark:border-primary-900/40 space-y-2">
                    <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto text-primary-500 shadow-sm">
                        <HeartHandshake size={24} />
                    </div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm">Belum pernah ke sini berdua</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                        Jadikan tempat ini tujuan kencan berikutnya dan catat momen indah kalian di sini!
                    </p>
                </div>
            )}
        </div>

      </div>

      {/* --- BOTTOM FLOATING ACTION BAR --- */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] z-30 safe-bottom">
         <Button 
            className={`w-full h-14 rounded-2xl shadow-xl text-base font-bold active:scale-95 transition-all ${
              visits.length > 0
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                : "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-primary-500/30"
            }`}
            onClick={() => setIsCheckInOpen(true)}
         >
             <CheckCircle size={22} className="mr-2" /> 
             {visits.length > 0 ? "Kunjungi Lagi & Tulis Ulasan Baru" : "Tandai Sudah Dikunjungi ❤️"}
         </Button>
      </div>

      {/* --- MODAL CHECK-IN --- */}
      <CheckInModal 
        isOpen={isCheckInOpen} 
        onClose={() => {
          setIsCheckInOpen(false);
          loadData(); // Re-sync data setelah modal check-in selesai
        }}
        placeId={place.id}
        placeName={place.name}
      />

    </div>
  );
}

function DetailSkeleton() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 max-w-md mx-auto">
            <Skeleton className="h-[48vh] w-full rounded-none" />
            <div className="-mt-8 bg-gray-50 dark:bg-gray-900 rounded-t-[2.5rem] px-6 py-8 relative z-10 space-y-6">
                <div className="flex gap-3 -mt-12">
                    <Skeleton className="h-12 flex-1 rounded-2xl bg-white dark:bg-gray-800" />
                    <Skeleton className="h-12 flex-1 rounded-2xl bg-white dark:bg-gray-800" />
                </div>
                <Skeleton className="h-24 w-full rounded-3xl" />
                <Skeleton className="h-20 w-full rounded-3xl" />
                <Skeleton className="h-32 w-full rounded-3xl" />
            </div>
        </div>
    );
}

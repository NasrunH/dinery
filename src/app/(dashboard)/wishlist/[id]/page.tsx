"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchAPI } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, MapPin, ExternalLink, PlayCircle, 
  Trash2, CheckCircle, Share2, User, Quote, Star, 
  Calendar, Repeat, Edit, Copy, Compass, Utensils,
  Sparkles, Clock, HeartHandshake, Check, Bookmark
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Place, Visit } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";
import CheckInModal from "@/components/modals/CheckInModal";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import Link from "next/link";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import CategoryIcon from "@/components/ui/CategoryIcon";
import { resolveAddressFromMaps, isForeignAddress } from "@/lib/addressResolver";
import { getContrastTextColor } from "@/lib/tagColor";

export default function DetailPlacePage() {
  const params = useParams();
  const router = useRouter();
  
  const [place, setPlace] = useState<Place | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isAddressCopied, setIsAddressCopied] = useState(false);
  const [addressText, setAddressText] = useState<string>("");
  const [isAddressResolving, setIsAddressResolving] = useState(false);

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

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
          category_icon: item.m_categories?.icon || "",
          price_level: item.m_price_ranges?.label || "$$",
          price_description: item.m_price_ranges?.description || "Harga terjangkau",
          tags: item.tags || (item.place_tags || []).map((t: any) => t.m_tags) || [],
          gmaps_link: item.maps_link,
          address_text: item.address_text || "",
          location: item.location,
          target_menu: item.target_menu || "",
          description: item.meta_title || "",
          created_by_name: item.created_by_user?.display_name || "Pasanganmu",
          created_at: item.created_at
      };
      setPlace(mappedPlace);

      // Sinkronkan alamat awal atau auto-resolve dari Google Maps (filter alamat luar negeri)
      const rawAddr = item.address_text;
      const validAddr = rawAddr && !isForeignAddress(rawAddr) ? rawAddr : "";
      if (validAddr) {
        setAddressText(validAddr);
      } else if (item.location || item.maps_link) {
        setIsAddressResolving(true);
        resolveAddressFromMaps(item.location, item.maps_link)
          .then((resolved) => {
            if (resolved && !isForeignAddress(resolved)) {
              setAddressText(resolved);
            }
          })
          .catch(() => {})
          .finally(() => {
            setIsAddressResolving(false);
          });
      }

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

  // Alamat efektif yang sudah lolos validasi (bebas dari alamat luar negeri/Virginia)
  const effectiveAddress = useMemo(() => {
    const candidate = addressText || place?.address_text;
    if (candidate && !isForeignAddress(candidate)) {
      return candidate;
    }
    return "";
  }, [addressText, place?.address_text]);

  const handleShare = async () => {
    if (!place) return;
    const currentAddress = effectiveAddress;
    const shareText = `Yuk makan di "${place.name}" (${place.category})!\n${currentAddress ? `Alamat: ${currentAddress}\n` : ''}${window.location.href}`;
    
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
    if (!effectiveAddress) return;
    navigator.clipboard.writeText(effectiveAddress);
    setIsAddressCopied(true);
    toast.success("Alamat lengkap disalin!");
    setTimeout(() => setIsAddressCopied(false), 2000);
  };

  if (loading) return <DetailSkeleton />;
  if (!place) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-32 relative transition-colors max-w-md mx-auto">
      
      {/* --- HERO BANNER & FOTO UTAMA (BERSIH & TIDAK TERTUTUP TEKS) --- */}
      <div className="relative h-[36vh] sm:h-[40vh] w-full bg-gray-950 overflow-hidden">
        <ImageWithFallback 
            src={place.image_url} 
            alt={place.name} 
            fill
            className="object-cover opacity-90 hover:scale-105 transition-transform duration-700"
            sizes="100vw"
            priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60"></div>

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
      </div>

      {/* --- CONTENT CONTAINER WITH OVERLAPPING TOP --- */}
      <div className="relative -mt-6 bg-white dark:bg-gray-900 rounded-t-[2.5rem] px-6 pt-6 pb-12 shadow-[0_-12px_40px_rgba(0,0,0,0.12)] min-h-[50vh] z-20 space-y-6 transition-colors">
        
        {/* --- HEADER TEMPAT (JUDUL & TAGS DI DALAM CARD AGAR FOTO TETAP BERSIH) --- */}
        <div className="space-y-3 pb-2 border-b border-gray-100 dark:border-gray-800">
            {/* Badges Bar (Tags Kategori & Status Selalu Jelas) */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60 text-[11px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    <CategoryIcon category={place.category} size={13} className="text-primary-600 dark:text-primary-400" />
                    <span>{place.category}</span>
                </span>

                <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[11px] font-bold rounded-full border border-amber-200/70 dark:border-amber-800/70 shadow-sm flex items-center gap-1">
                    <span className="font-black">{place.price_level}</span>
                    <span className="opacity-40">•</span>
                    <span>{place.price_description || (place.price_level === "$" ? "Hemat (< 50k)" : place.price_level === "$$$" ? "Mewah (> 100k)" : "Menengah (50k - 100k)")}</span>
                </span>

                {visits.length > 0 ? (
                  <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded-full border border-emerald-200/70 dark:border-emerald-800/70 shadow-sm flex items-center gap-1">
                    <CheckCircle size={12} /> Sudah Dikunjungi ({visits.length}x)
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-[11px] font-bold rounded-full border border-rose-200/70 dark:border-rose-800/70 shadow-sm flex items-center gap-1">
                    <Bookmark size={12} /> Belum Dikunjungi
                  </span>
                )}

                {place.platform && (
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] font-semibold rounded-full border border-gray-200 dark:border-gray-700">
                    Via {place.platform}
                  </span>
                )}
            </div>

            {/* Nama Tempat (Bisa Panjang Tanpa Mengganggu Gambar) */}
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-snug break-words">
              {place.name}
            </h1>
            
            {/* Metadata Info Pembuat & Waktu */}
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap pt-0.5">
                <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center text-[10px] font-bold">
                        <User size={12} />
                    </div>
                    <span>Disimpan oleh <strong className="text-gray-800 dark:text-gray-200">{place.created_by_name}</strong></span>
                </div>

                {place.created_at && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                    <Clock size={11} /> {new Date(place.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
            </div>
        </div>

        {/* --- QUICK ACTION BUTTONS --- */}
        <div className="grid grid-cols-2 gap-3">
            {place.gmaps_link ? (
                <a 
                    href={place.gmaps_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="py-3 px-4 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-blue-200/60 dark:border-blue-800/60 hover:-translate-y-0.5 active:scale-95 transition-all shadow-sm"
                >
                    <Compass size={18} className="text-blue-500" /> Rute Google Maps
                </a>
            ) : (
                <div className="py-3 px-4 bg-gray-50 dark:bg-gray-800/50 text-gray-400 rounded-2xl font-medium text-xs flex items-center justify-center gap-1 border border-gray-100 dark:border-gray-800">
                    <MapPin size={16} /> Tanpa Link Maps
                </div>
            )}

            {place.original_link ? (
                <a 
                    href={place.original_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 hover:-translate-y-0.5 active:scale-95 transition-all shadow-sm"
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
                  className="py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 hover:-translate-y-0.5 active:scale-95 transition-all shadow-sm"
                >
                  <Share2 size={16} className="text-primary-500" /> Bagikan Tempat
                </button>
            )}
        </div>

        {/* --- 1. CARD ALAMAT LENGKAP DARI GOOGLE MAPS --- */}
        <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-transparent dark:from-blue-950/20 dark:via-gray-800/40 dark:to-transparent p-5 rounded-3xl border border-blue-100/80 dark:border-blue-900/40 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-500 text-white rounded-xl shadow-md shadow-blue-500/20">
                        <MapPin size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Alamat Lengkap</h3>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Terintegrasi otomatis dari Google Maps</p>
                    </div>
                </div>

                {effectiveAddress && (
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
                {isAddressResolving ? (
                    <div className="space-y-2 py-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                ) : effectiveAddress ? (
                    <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed font-medium">
                        {effectiveAddress}
                    </p>
                ) : place.gmaps_link ? (
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 py-1">
                        <span>Alamat terhubung langsung via navigasi Google Maps.</span>
                        <a 
                            href={place.gmaps_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 font-bold hover:underline shrink-0 ml-2"
                        >
                            Buka Maps &rarr;
                        </a>
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                        Belum ada tautan lokasi Google Maps.
                    </p>
                )}
            </div>

            {place.gmaps_link && (
                <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-gray-500 dark:text-gray-400 text-[11px]">Navigasi GPS Akurat</span>
                    <a 
                        href={place.gmaps_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                    >
                        Petunjuk Arah &rarr;
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

        {/* --- 3. HARGA & KATEGORI HIGHLIGHT (Selalu Tampil) --- */}
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
                <p className="text-base font-black text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <CategoryIcon category={place.category} size={18} className="text-primary-500" /> {place.category}
                </p>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                    {visits.length > 0 ? (
                      <>
                        <span>Rating Rata-rata {averageRating}</span>
                        <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
                      </>
                    ) : "Belum di-review"}
                </div>
            </div>
        </div>

        {/* --- 4. VIBE & SUASANA (TAGS) (Selalu Tampil) --- */}
        {place.tags && place.tags.length > 0 && (
            <div className="space-y-2.5">
                <h3 className="font-extrabold text-gray-800 dark:text-gray-100 text-xs tracking-widest uppercase text-gray-400">
                    Vibe & Suasana
                </h3>
                <div className="flex flex-wrap gap-2">
                    {place.tags.map((tag: any, idx: number) => {
                        const tagName = tag.name || tag.m_tags?.name || "Tag";
                        const tagColor = tag.color || tag.m_tags?.color || "#ec4899";
                        const contrastTextColor = getContrastTextColor(tagColor);
                        
                        return (
                            <span 
                                key={idx} 
                                className="px-3 py-1 rounded-xl text-xs font-bold shadow-xs border transition-all inline-flex items-center gap-1.5"
                                style={{ 
                                    backgroundColor: tagColor, 
                                    color: contrastTextColor,
                                    borderColor: tagColor
                                }}
                            >
                                <span>#{tagName}</span>
                            </span>
                        );
                    })}
                </div>
            </div>
        )}

        {/* --- 5. TIMELINE KUNJUNGAN & REVIEW PASANGAN --- */}
        <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-extrabold text-gray-900 dark:text-gray-100 text-base flex items-center gap-2">
                        <HeartHandshake size={20} className="text-primary-500" /> Kenangan Kunjungan Berdua
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {visits.length > 0 
                          ? `Sudah ${visits.length} kali makan di sini bersama pasangan` 
                          : "Belum ada kunjungan yang dicatat"
                        }
                    </p>
                </div>

                {visits.length > 0 && (
                    <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-2xl font-black text-sm border border-amber-200/50">
                        <Star size={16} className="fill-amber-400 text-amber-400" />
                        <span>{averageRating}</span>
                        <span className="text-[10px] text-gray-400 font-normal">/ 5.0</span>
                    </div>
                )}
            </div>

            {visits.length > 0 ? (
                <div className="space-y-3">
                    {visits.map((visit, idx) => (
                        <div 
                          key={visit.id || idx} 
                          className="p-4 bg-gray-50/90 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2.5 hover:border-primary-200 dark:hover:border-primary-900/50 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 text-amber-400">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star 
                                            key={star} 
                                            size={14} 
                                            className={star <= visit.rating ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"} 
                                        />
                                    ))}
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1.5">{visit.rating}.0</span>
                                </div>

                                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                                    <Calendar size={12} />
                                    <span>
                                        {visit.visit_date ? new Date(visit.visit_date).toLocaleDateString("id-ID", {
                                            day: "numeric", month: "short", year: "numeric"
                                        }) : "-"}
                                    </span>
                                </div>
                            </div>

                            {visit.repeat_order && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
                                    <Repeat size={10} /> Mau Balik Lagi!
                                </span>
                            )}

                            {visit.review_text && (
                                <div className="relative pl-3 border-l-2 border-primary-300 dark:border-primary-700/60">
                                    <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed italic">
                                        "{visit.review_text}"
                                    </p>
                                </div>
                            )}

                            {/* Foto Kenangan Sesi Kunjungan */}
                            {visit.photo_urls && visit.photo_urls.length > 0 && (
                                <div className="flex gap-2 pt-1 overflow-x-auto no-scrollbar">
                                    {visit.photo_urls.map((photo, pIdx) => (
                                        <div key={pIdx} className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-black/5 relative">
                                            <img src={photo} alt="Kenangan" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Reviewer Signature */}
                            {visit.reviewer_name && (
                              <div className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1.5 pt-1 border-t border-gray-100 dark:border-gray-800">
                                {visit.reviewer_avatar ? (
                                  <img src={visit.reviewer_avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                                ) : (
                                  <User size={11} />
                                )}
                                <span>Ditulis oleh <strong className="text-gray-600 dark:text-gray-300">{visit.reviewer_name}</strong></span>
                              </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/40 dark:to-gray-900/40 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/50 flex items-center justify-center text-primary-500 mb-3 mx-auto">
                        <Sparkles size={28} />
                    </div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1">Belum Pernah ke Sini Berdua</h4>
                    <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs mx-auto leading-relaxed mb-4">
                        Yuk agendakan kencan kuliner berikutnya ke tempat ini dan simpan momen spesial kalian berdua!
                    </p>
                    <Button 
                        onClick={() => setIsCheckInOpen(true)}
                        className="bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-primary-500/20"
                    >
                        Tandai Sudah Dikunjungi Sekarang
                    </Button>
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
             {visits.length > 0 ? "Kunjungi Lagi & Tulis Ulasan Baru" : "Tandai Sudah Dikunjungi"}
         </Button>
      </div>

      {/* --- MODAL CHECK-IN --- */}
      <CheckInModal 
        isOpen={isCheckInOpen} 
        onClose={() => setIsCheckInOpen(false)}
        onSuccess={() => loadData(false)}
        placeId={place.id}
        placeName={place.name}
      />

    </div>
  );
}

function DetailSkeleton() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 max-w-md mx-auto">
            <Skeleton className="h-[38vh] w-full rounded-none" />
            <div className="-mt-6 bg-gray-50 dark:bg-gray-900 rounded-t-[2.5rem] px-6 py-8 relative z-10 space-y-6">
                <Skeleton className="h-6 w-1/3 rounded-full" />
                <Skeleton className="h-10 w-4/5 rounded-xl" />
                <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-12 rounded-2xl" />
                    <Skeleton className="h-12 rounded-2xl" />
                </div>
                <Skeleton className="h-28 w-full rounded-3xl" />
                <Skeleton className="h-24 w-full rounded-3xl" />
            </div>
        </div>
    );
}

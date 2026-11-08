"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { ArrowLeft, Link2, MapPin, Image as ImageIcon, Search, Loader2, HelpCircle, PlusCircle, Sparkles, Check, ExternalLink } from "lucide-react";
import CategoryIcon from "@/components/ui/CategoryIcon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TagSelector } from "@/components/ui/TagSelector";
import { Category, Tag, PlacePayload } from "@/types";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { GoogleMapsGuideline } from "@/components/modals/GoogleMapsGuideline";
import CreateTagModal from "@/components/modals/CreateTagModal";
import { isForeignAddress } from "@/lib/addressResolver";
import MapPreview from "@/components/MapPreview";

export default function AddWishlistPage() {
  const router = useRouter();

  // --- STATE 1: Master Data & UI ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isMasterLoading, setIsMasterLoading] = useState(true);
  const [step, setStep] = useState<1 | 2>(1);
  const [showGuide, setShowGuide] = useState(false);
  const [isCreateTagOpen, setIsCreateTagOpen] = useState(false);

  // --- STATE 2: Link Input & Preview ---
  const [socialLink, setSocialLink] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [suggestedName, setSuggestedName] = useState("");
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [previewMeta, setPreviewMeta] = useState({
    original_link: "",
    platform: "",
    meta_title: "",
    meta_image: "",
  });

  // Helper ekstraksi koordinat cepat dari URL Maps langsung (fallback lokal instan 0ms)
  const extractCoordsFromUrl = (url: string): { lat: number; lng: number } | null => {
    if (!url) return null;
    const pinMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (pinMatch) return { lat: parseFloat(pinMatch[1]), lng: parseFloat(pinMatch[2]) };
    const qMatch = url.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    return null;
  };

  // --- STATE 3: Form Data Manual ---
  const [formData, setFormData] = useState<PlacePayload>({
    name: "",
    maps_link: "",
    address_text: "",
    target_menu: "",
    category_id: 0,
    price_range_id: 2, 
    tag_ids: [],
  });

  const loadMasterData = async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          fetchAPI("/master/categories"),
          fetchAPI("/master/tags"),
        ]);
        setCategories(catRes.data || []);
        setTags(tagRes.data || []);
      } catch (err) {
        console.error("Gagal load master data", err);
      } finally {
        setIsMasterLoading(false);
      }
    };

  useEffect(() => {
    loadMasterData();
  }, []);

  const resolveMapsAddress = async (mapsUrl: string) => {
    if (!mapsUrl) return;
    const isMaps = mapsUrl.includes("google.com/maps") || mapsUrl.includes("goo.gl") || mapsUrl.includes("share.google");
    if (!isMaps) return;

    // Coba ekstraksi cepat di frontend terlebih dahulu
    const quickCoords = extractCoordsFromUrl(mapsUrl);
    if (quickCoords) {
      setMapCoords(quickCoords);
    }

    setIsResolvingAddress(true);
    try {
      const res = await fetchAPI("/places/resolve-maps", {
        method: "POST",
        body: JSON.stringify({ maps_link: mapsUrl }),
      });
      const data = res.data || {};
      if (data.address_text && !isForeignAddress(data.address_text)) {
        setFormData((prev) => ({
          ...prev,
          address_text: data.address_text,
        }));
        toast.success("Alamat lengkap otomatis terisi dari Google Maps!", { id: "maps-addr-toast" });
      }
      if (data.suggested_name) {
        setSuggestedName(data.suggested_name);
      }
      if (data.lat && data.long) {
        setMapCoords({ lat: data.lat, lng: data.long });
      }
    } catch (e) {
      console.warn("Gagal auto-resolve alamat:", e);
    } finally {
      setIsResolvingAddress(false);
    }
  };

  const handleMapsLinkChange = (value: string) => {
    setFormData((prev) => ({ ...prev, maps_link: value }));
    const trimmed = value.trim();
    if (trimmed.includes("google.com/maps") || trimmed.includes("goo.gl") || trimmed.includes("share.google")) {
      resolveMapsAddress(trimmed);
    }
  };

  const handleCheckLink = async () => {
    if (!socialLink) return;
    setIsPreviewLoading(true);

    try {
      const res = await fetchAPI("/places/preview", {
        method: "POST",
        body: JSON.stringify({ url: socialLink }),
      });

      const data = res.data || {};

      const title = data.meta_title || data.title || ""; 
      const image = data.meta_image || data.image_url || "";
      const platform = data.platform || "Web";
      const resolvedAddress = (data.address_text && !isForeignAddress(data.address_text)) ? data.address_text : "";

      // Bersihkan saran nama dari separator atau caption panjang
      let cleanCandidate = data.suggested_name || "";
      if (!cleanCandidate && title) {
        const parts = title.replace(' - Google Maps', '').split(/[,·•\uFFFD]/);
        cleanCandidate = parts[0].trim();
      }

      setPreviewMeta({
        original_link: socialLink,
        platform: platform,
        meta_title: title,
        meta_image: image, 
      });

      // Simpan saran nama (TIDAK langsung timpa formData.name agar tidak kepanjangan)
      if (cleanCandidate) {
        setSuggestedName(cleanCandidate);
      }

      const isMaps = socialLink.includes("google.com/maps") || socialLink.includes("maps.app.goo.gl") || socialLink.includes("share.google");

      if (data.lat && data.long) {
        setMapCoords({ lat: data.lat, lng: data.long });
      } else if (isMaps) {
        const quick = extractCoordsFromUrl(socialLink);
        if (quick) setMapCoords(quick);
      }

      setFormData((prev) => ({
        ...prev,
        // Nama tempat tidak dipaksa terisi otomatis, tetap kosong kecuali sudah diisi user
        name: prev.name.trim() ? prev.name : "",
        maps_link: isMaps ? socialLink : prev.maps_link,
        address_text: resolvedAddress || prev.address_text || "",
      }));

      // Jika alamat belum terisi dan ini Google Maps link, resolve di background
      if (isMaps && (!resolvedAddress || !data.lat)) {
        resolveMapsAddress(socialLink);
      }

      setStep(2);
    } catch (err) {
      console.warn("Preview gagal, lanjut manual");
      setPreviewMeta((prev) => ({ ...prev, original_link: socialLink }));
      setStep(2);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // --- ADD CUSTOM TAG LOGIC ---
  const handleTagCreated = (newTag: Tag) => {
    setTags((prev) => [...prev, newTag]);
    setFormData((prev) => ({
      ...prev,
      tag_ids: [...prev.tag_ids, newTag.id],
    }));
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category_id) {
        toast.error("Nama Tempat dan Kategori wajib diisi!");
        return;
    }
    
    setIsSaving(true);

    const payload: PlacePayload = {
        ...formData,
        original_link: previewMeta.original_link,
        platform: previewMeta.platform,
        meta_title: previewMeta.meta_title,
        meta_image: previewMeta.meta_image,
    };

    try {
      await fetchAPI("/places", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      toast.success("Wishlist berhasil disimpan!");
      router.push("/wishlist");
      router.refresh(); 
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan wishlist.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isMasterLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
            <Loader2 className="animate-spin text-primary-500" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors pb-24">
      
      <GoogleMapsGuideline isOpen={showGuide} onClose={() => setShowGuide(false)} />
      <CreateTagModal 
        isOpen={isCreateTagOpen} 
        onClose={() => setIsCreateTagOpen(false)} 
        onCreated={handleTagCreated} 
      />

      {/* Header Sticky */}
      <div className="bg-white dark:bg-gray-900 px-6 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-sm border-b border-transparent dark:border-gray-800 transition-colors">
        <button 
          onClick={() => step === 2 ? setStep(1) : router.back()} 
          className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {step === 1 ? "Tambah Link" : "Lengkapi Info"}
        </h1>
      </div>

      <div className="p-6 max-w-md mx-auto">
        
        {/* --- STEP 1: INPUT LINK --- */}
        <div className={`transition-all duration-500 ${step === 1 ? "block" : "hidden"}`}>
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl shadow-primary-100/50 dark:shadow-none text-center border border-transparent dark:border-gray-800">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-100 dark:from-primary-950 to-peach-light dark:to-pink-950/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary-600 dark:text-primary-400 shadow-inner">
                    <Search size={32} />
                </div>
                
                <h2 className="font-bold text-2xl text-gray-800 dark:text-gray-100 mb-2">Dapat referensi dari mana?</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                    Tempel link TikTok, Instagram, atau Google Maps. Biar AI kami yang bantu isi datanya.
                </p>
                
                <form onSubmit={(e) => { e.preventDefault(); handleCheckLink(); }} className="space-y-4">
                    <Input 
                        icon={<Link2 size={20}/>}
                        placeholder="https://..."
                        value={socialLink}
                        onChange={(e) => setSocialLink(e.target.value)}
                    />
                    
                    <Button 
                        type="submit"
                        isLoading={isPreviewLoading} 
                        disabled={!socialLink}
                        className="shadow-lg shadow-primary-200 w-full"
                    >
                        <span className="flex items-center justify-center gap-1.5">
                            <Sparkles size={16} /> Cek Link Ajaib
                        </span>
                    </Button>
                    
                    <div className="relative py-3">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100 dark:border-gray-800"></span></div>
                        <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest"><span className="bg-white dark:bg-gray-900 px-2 text-gray-300 dark:text-gray-500">SKIP</span></div>
                    </div>
                    
                    <Button type="button" variant="ghost" onClick={() => setStep(2)} className="w-full text-gray-400 dark:text-gray-500 font-normal hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        Isi Manual Tanpa Link
                    </Button>
                </form>
            </div>
        </div>

        {/* --- STEP 2: FORM LENGKAP --- */}
        <div className={`transition-all duration-500 ${step === 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 hidden"}`}>
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Preview Image */}
                <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800">
                    {previewMeta.meta_image ? (
                        <img 
                            src={previewMeta.meta_image} 
                            alt="Preview" 
                            className="w-full h-full object-contain" 
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800">
                            <ImageIcon size={32} className="mb-2 opacity-50"/>
                            <span className="text-xs font-medium">Tidak ada gambar preview</span>
                        </div>
                    )}
                    {previewMeta.original_link ? (
                        <a 
                            href={previewMeta.original_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute top-2 left-2 bg-black/70 hover:bg-black/90 active:scale-95 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition border border-white/20 shadow-md group"
                            title="Buka link asli"
                        >
                            <span>Via {previewMeta.platform || "Sosmed"}</span>
                            <ExternalLink size={11} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                        </a>
                    ) : previewMeta.platform ? (
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-md font-bold">
                            Via {previewMeta.platform}
                        </div>
                    ) : null}
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-5">
                    
                    <div className="relative">
                        <Input 
                            label="Nama Tempat"
                            placeholder="Contoh: Bakso Pak Kumis"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                        />
                        {suggestedName && formData.name !== suggestedName && (
                            <div className="mt-2.5 p-3 bg-gray-50 dark:bg-gray-800/90 rounded-2xl border border-gray-200 dark:border-gray-700/80 flex items-center justify-between gap-3 shadow-xs transition-colors">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-xl bg-primary-100/70 dark:bg-primary-950/80 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 border border-primary-200/50 dark:border-primary-900/50">
                                        <Sparkles size={16} />
                                    </div>
                                    <div className="min-w-0 flex flex-col">
                                        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wider">Saran Nama</span>
                                        <span className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">{suggestedName}</span>
                                    </div>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setFormData({...formData, name: suggestedName})}
                                    className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1 shrink-0"
                                >
                                    <Check size={13} strokeWidth={2.5} /> Gunakan
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Link Google Maps (Wajib)</label>
                            <button 
                                type="button" 
                                onClick={() => setShowGuide(true)}
                                className="text-[10px] flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 bg-primary-50 dark:bg-primary-950/50 px-2 py-0.5 rounded-md font-semibold transition"
                            >
                                <HelpCircle size={10} /> Cara copy?
                            </button>
                        </div>
                        <Input 
                            icon={<MapPin size={18}/>}
                            placeholder="https://maps.app.goo.gl/..."
                            value={formData.maps_link}
                            onChange={(e) => handleMapsLinkChange(e.target.value)}
                            required
                            rightElement={
                              isResolvingAddress ? (
                                <Loader2 size={16} className="animate-spin text-primary-500" />
                              ) : formData.address_text ? (
                                <Check size={16} className="text-emerald-500" strokeWidth={3} />
                              ) : null
                            }
                        />
                        {isResolvingAddress ? (
                          <p className="text-[11px] font-semibold text-primary-500 dark:text-primary-400 mt-1 ml-1 flex items-center gap-1">
                            <Loader2 size={11} className="animate-spin" /> Mendeteksi alamat dari Google Maps...
                          </p>
                        ) : formData.address_text ? (
                          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 ml-1 flex items-center gap-1">
                            <Check size={11} strokeWidth={3} /> Alamat lengkap terisi otomatis
                          </p>
                        ) : (
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 ml-1">*Penting untuk fitur 'Cari Terdekat'</p>
                        )}
                    </div>

                    {/* Preview Peta Interaktif */}
                    <MapPreview 
                        lat={mapCoords?.lat}
                        lng={mapCoords?.lng}
                        placeName={formData.name || suggestedName || previewMeta.meta_title}
                        addressText={formData.address_text}
                        mapsLink={formData.maps_link}
                        isLoading={isResolvingAddress}
                    />

                    <div>
                        <Input 
                            label="Alamat Lengkap"
                            placeholder="Otomatis terisi dari Google Maps..."
                            value={formData.address_text || ""}
                            onChange={(e) => setFormData({...formData, address_text: e.target.value})}
                        />
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 ml-1">
                            *Alamat lengkap otomatis dideteksi dari link Google Maps.
                        </p>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
                                Link Referensi Sosmed (Opsional)
                            </label>
                            {previewMeta.original_link && (
                                <a 
                                    href={previewMeta.original_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 hover:underline"
                                >
                                    <ExternalLink size={12} /> Buka Postingan
                                </a>
                            )}
                        </div>
                        <Input 
                            icon={<Link2 size={18} />}
                            placeholder="https://tiktok.com/... atau https://instagram.com/..."
                            value={previewMeta.original_link}
                            onChange={(e) => setPreviewMeta(prev => ({ ...prev, original_link: e.target.value }))}
                            rightElement={
                                previewMeta.original_link ? (
                                    <a
                                        href={previewMeta.original_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 bg-primary-50 dark:bg-primary-950/70 hover:bg-primary-100 dark:hover:bg-primary-900/60 text-primary-600 dark:text-primary-400 rounded-xl transition flex items-center gap-1 text-[11px] font-bold shrink-0"
                                        title="Kunjungi Postingan"
                                    >
                                        <ExternalLink size={15} />
                                    </a>
                                ) : null
                            }
                        />
                        {previewMeta.original_link && (
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 ml-1 flex items-center gap-1">
                                *Tersimpan agar kalian bisa menonton kembali video review makanannya kapan saja.
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ml-1">Kategori</label>
                        <div className="flex flex-wrap gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setFormData({...formData, category_id: cat.id})}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                                        formData.category_id === cat.id 
                                        ? "bg-primary-50 dark:bg-primary-950/50 border-primary-500 text-primary-700 dark:text-primary-400 shadow-sm" 
                                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    }`}
                                >
                                    <CategoryIcon category={cat.name} size={13} className="shrink-0" />
                                    <span>{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ml-1">Range Harga</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 1, label: "$", desc: "Hemat", range: "< 50k" },
                                { id: 2, label: "$$", desc: "Menengah", range: "50k - 100k" },
                                { id: 3, label: "$$$", desc: "Mewah", range: "> 100k" }
                            ].map((price) => {
                                const isSelected = formData.price_range_id === price.id;
                                return (
                                    <button
                                        key={price.id}
                                        type="button"
                                        onClick={() => setFormData({...formData, price_range_id: price.id})}
                                        className={`py-2 px-1 rounded-2xl border text-center transition-all ${
                                            isSelected 
                                            ? "bg-primary-50 dark:bg-primary-950/60 border-primary-500 text-primary-700 dark:text-primary-300 shadow-sm ring-1 ring-primary-500/30" 
                                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                                        }`}
                                    >
                                        <div className={`text-base font-black tracking-wider ${isSelected ? "text-primary-600 dark:text-primary-400" : "text-gray-700 dark:text-gray-300"}`}>
                                            {price.label}
                                        </div>
                                        <div className="text-[11px] font-bold leading-tight">
                                            {price.desc}
                                        </div>
                                        <div className="text-[9px] opacity-75 font-medium">
                                            ({price.range})
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <Input 
                        label="Menu Incaran (Opsional)"
                        placeholder="Misal: Indomie Nyemek"
                        value={formData.target_menu}
                        onChange={(e) => setFormData({...formData, target_menu: e.target.value})}
                    />

                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Tags</label>
                            <button 
                                type="button" 
                                onClick={() => setIsCreateTagOpen(true)}
                                className="text-[10px] flex items-center gap-1 text-primary-600 dark:text-primary-400 font-bold hover:text-primary-700 dark:hover:text-primary-300 bg-primary-50 dark:bg-primary-950/50 px-2 py-1 rounded-md transition"
                            >
                                <PlusCircle size={12}/> Buat Tag Baru
                            </button>
                        </div>
                        <TagSelector 
                            tags={tags}
                            selectedIds={formData.tag_ids}
                            onChange={(ids) => setFormData({...formData, tag_ids: ids})}
                        />
                    </div>
                </div>

                <Button type="submit" isLoading={isSaving} className="shadow-xl shadow-primary-200/50 mb-10 w-full">
                    Simpan ke Wishlist
                </Button>
            </form>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, MapPin, Save, Loader2, Check, PlusCircle, Link2, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TagSelector } from "@/components/ui/TagSelector";
import { Category, Tag } from "@/types";
import CategoryIcon from "@/components/ui/CategoryIcon";
import toast from "react-hot-toast";
import CreateTagModal from "@/components/modals/CreateTagModal";
import { isForeignAddress } from "@/lib/addressResolver";

export default function EditWishlistPage() {
  const router = useRouter();
  const params = useParams();
  const placeId = params.id;

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isCreateTagOpen, setIsCreateTagOpen] = useState(false);
  const [suggestedName, setSuggestedName] = useState("");
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    maps_link: "",
    address_text: "",
    original_link: "",
    target_menu: "",
    category_id: 0,
    price_range_id: 2,
    tag_ids: [] as number[],
  });

  const handleTagCreated = (newTag: Tag) => {
    setTags((prev) => [...prev, newTag]);
    setFormData((prev) => ({
      ...prev,
      tag_ids: [...prev.tag_ids, newTag.id],
    }));
  };

  const resolveMapsAddress = async (mapsUrl: string) => {
    if (!mapsUrl) return;
    const isMaps = mapsUrl.includes("google.com/maps") || mapsUrl.includes("goo.gl") || mapsUrl.includes("share.google");
    if (!isMaps) return;

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
        toast.success("Alamat lengkap otomatis terisi dari Google Maps!", { id: "edit-maps-addr" });
      }
      if (data.suggested_name) {
        setSuggestedName(data.suggested_name);
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

  // --- LOAD DATA ---
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        // 1. Load Master Data & Detail Place secara paralel
        const [catRes, tagRes, placeRes] = await Promise.all([
          fetchAPI("/master/categories"),
          fetchAPI("/master/tags"),
          fetchAPI(`/places/${placeId}`)
        ]);

        setCategories(catRes.data || []);
        setTags(tagRes.data || []);

        // 2. Isi Form dengan Data Lama
        const item = placeRes.data;
        if (item) {
            setFormData({
                name: item.name,
                maps_link: item.maps_link || "",
                address_text: (item.address_text && !isForeignAddress(item.address_text)) ? item.address_text : "",
                original_link: item.original_link || "",
                target_menu: item.target_menu || "",
                category_id: item.category_id || 0,
                price_range_id: item.price_range_id || 2,
                // Map array object tags menjadi array ID
                tag_ids: item.place_tags 
                    ? item.place_tags.map((pt: any) => pt.m_tags?.id).filter(Boolean)
                    : (item.tags ? item.tags.map((t: any) => t.id) : [])
            });
        }

      } catch (err) {
        console.error(err);
        toast.error("Gagal memuat data tempat.");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (placeId) initData();
  }, [placeId, router]);

  // --- HANDLE SUBMIT ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category_id) {
        toast.error("Nama dan Kategori wajib diisi!");
        return;
    }

    setIsSaving(true);
    const loadingToast = toast.loading("Menyimpan perubahan...");

    try {
        await fetchAPI(`/places/${placeId}`, {
            method: "PUT",
            body: JSON.stringify(formData)
        });

        toast.dismiss(loadingToast);
        toast.success("Data tempat berhasil diupdate!");
        router.push(`/wishlist/${placeId}`); // Balik ke detail
        router.refresh(); 

    } catch (err: any) {
        toast.dismiss(loadingToast);
        toast.error(err.message || "Gagal update tempat.");
    } finally {
        setIsSaving(false);
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
            <Loader2 className="animate-spin text-primary-500" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors pb-24">
      <CreateTagModal 
        isOpen={isCreateTagOpen} 
        onClose={() => setIsCreateTagOpen(false)} 
        onCreated={handleTagCreated} 
      />
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 px-6 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-sm border-b border-gray-100 dark:border-gray-800 transition-colors">
        <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">Edit Info Tempat</h1>
      </div>

      <div className="p-6 max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                <div>
                  <Input 
                      label="Nama Tempat"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Nama tempat..."
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
                    <Input 
                        label="Link Google Maps"
                        icon={<MapPin size={18}/>}
                        value={formData.maps_link}
                        onChange={(e) => handleMapsLinkChange(e.target.value)}
                        placeholder="https://maps.app.goo.gl/..."
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
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 ml-1">Mengubah link ini akan memperbarui titik peta.</p>
                    )}
                </div>

                <div>
                    <Input 
                        label="Alamat Lengkap"
                        value={formData.address_text}
                        onChange={(e) => setFormData({...formData, address_text: e.target.value})}
                        placeholder="Otomatis diperbarui dari Google Maps..."
                    />
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 ml-1">
                        *Alamat lengkap otomatis dideteksi dari Google Maps.
                    </p>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
                            Link Referensi Sosmed (Opsional)
                        </label>
                        {formData.original_link && (
                            <a 
                                href={formData.original_link}
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
                        value={formData.original_link}
                        onChange={(e) => setFormData({...formData, original_link: e.target.value})}
                        rightElement={
                            formData.original_link ? (
                                <a
                                    href={formData.original_link}
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
                    {formData.original_link && (
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 ml-1 flex items-center gap-1">
                            *Link video atau postingan referensi dari TikTok/Instagram.
                        </p>
                    )}
                </div>

                {/* Kategori */}
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

                {/* Harga */}
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
                    label="Menu Incaran"
                    value={formData.target_menu}
                    onChange={(e) => setFormData({...formData, target_menu: e.target.value})}
                    placeholder="Menu wajib coba..."
                />

                {/* Tags */}
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

                <Button type="submit" isLoading={isSaving} className="w-full shadow-xl shadow-primary-200/50">
                    <Save size={18} className="mr-2"/> Simpan Perubahan
                </Button>

            </form>
        </div>
      </div>
    </div>
  );
}
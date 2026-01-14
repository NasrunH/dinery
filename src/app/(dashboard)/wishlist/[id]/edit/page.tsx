"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, MapPin, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TagSelector } from "@/components/ui/TagSelector";
import { Category, Tag } from "@/types";
import toast from "react-hot-toast";

export default function EditWishlistPage() {
  const router = useRouter();
  const params = useParams();
  const placeId = params.id;

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    maps_link: "",
    target_menu: "",
    category_id: 0,
    price_range_id: 2,
    tag_ids: [] as number[],
  });

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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="animate-spin text-primary-500" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-sm border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Edit Info Tempat</h1>
      </div>

      <div className="p-6 max-w-md mx-auto">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                <Input 
                    label="Nama Tempat"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nama tempat..."
                    required
                />

                <div>
                    <Input 
                        label="Link Google Maps"
                        icon={<MapPin size={18}/>}
                        value={formData.maps_link}
                        onChange={(e) => setFormData({...formData, maps_link: e.target.value})}
                        placeholder="https://maps.app.goo.gl/..."
                        required
                    />
                    <p className="text-[10px] text-gray-400 mt-1 ml-1">Mengubah link ini akan memperbarui titik peta.</p>
                </div>

                {/* Kategori */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Kategori</label>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setFormData({...formData, category_id: cat.id})}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                    formData.category_id === cat.id 
                                    ? "bg-primary-50 border-primary-500 text-primary-700 shadow-sm" 
                                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Harga */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Range Harga</label>
                    <div className="flex bg-gray-50 p-1 rounded-xl">
                        {[
                            { id: 1, label: "$ Murah" },
                            { id: 2, label: "$$ Sedang" },
                            { id: 3, label: "$$$ Mahal" }
                        ].map((price) => (
                            <button
                                key={price.id}
                                type="button"
                                onClick={() => setFormData({...formData, price_range_id: price.id})}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                                    formData.price_range_id === price.id 
                                    ? "bg-white text-green-600 shadow-sm ring-1 ring-black/5" 
                                    : "text-gray-400 hover:text-gray-600"
                                }`}
                            >
                                {price.label}
                            </button>
                        ))}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Tags</label>
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
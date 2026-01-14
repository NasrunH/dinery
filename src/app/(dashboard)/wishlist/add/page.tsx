"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { ArrowLeft, Link2, MapPin, Image as ImageIcon, Search, Loader2, HelpCircle, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TagSelector } from "@/components/ui/TagSelector";
import { Category, Tag, PlacePayload } from "@/types";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { GoogleMapsGuideline } from "@/components/modals/GoogleMapsGuideline";

export default function AddWishlistPage() {
  const router = useRouter();

  // --- STATE 1: Master Data & UI ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isMasterLoading, setIsMasterLoading] = useState(true);
  const [step, setStep] = useState<1 | 2>(1);
  const [showGuide, setShowGuide] = useState(false);

  // --- STATE 2: Link Input & Preview ---
  const [socialLink, setSocialLink] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewMeta, setPreviewMeta] = useState({
    original_link: "",
    platform: "",
    meta_title: "",
    meta_image: "",
  });

  // --- STATE 3: Form Data Manual ---
  const [formData, setFormData] = useState<PlacePayload>({
    name: "",
    maps_link: "",
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

      setPreviewMeta({
        original_link: socialLink,
        platform: platform,
        meta_title: title,
        meta_image: image, 
      });

      setFormData((prev) => ({
        ...prev,
        name: title,
        maps_link: socialLink.includes("google.com/maps") || socialLink.includes("maps.app.goo.gl") 
          ? socialLink 
          : prev.maps_link,
      }));

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
  const handleAddCustomTag = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Buat Tag Sendiri',
      html: `
        <div class="flex flex-col gap-3 text-left">
            <div>
                <label class="text-sm font-bold text-gray-700 block mb-1">Nama Tag</label>
                <input id="swal-tag-name" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Contoh: Malam Minggu">
            </div>
            <div>
                <label class="text-sm font-bold text-gray-700 block mb-1">Warna (Opsional)</label>
                <div class="flex gap-2 items-center">
                    <input type="color" id="swal-tag-color" value="#FF00FF" class="w-10 h-10 p-1 rounded cursor-pointer">
                    <span class="text-xs text-gray-400">Klik kotak untuk pilih warna</span>
                </div>
            </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Simpan Tag',
      confirmButtonColor: '#ec4899',
      cancelButtonText: 'Batal',
      focusConfirm: false,
      preConfirm: () => {
        const name = (document.getElementById('swal-tag-name') as HTMLInputElement).value;
        const color = (document.getElementById('swal-tag-color') as HTMLInputElement).value;
        
        if (!name) {
          Swal.showValidationMessage('Nama tag wajib diisi!');
          return false;
        }
        return { name, color };
      }
    });

    if (formValues) {
        const loadingToast = toast.loading("Membuat tag...");
        try {
            // Hit API Create Tag
            const res = await fetchAPI("/master/tags", {
                method: "POST",
                body: JSON.stringify(formValues)
            });

            const newTag = res.data;
            
            // Update State Tags & Auto Select Tag Baru
            setTags(prev => [...prev, newTag]);
            setFormData(prev => ({
                ...prev,
                tag_ids: [...prev.tag_ids, newTag.id]
            }));

            toast.dismiss(loadingToast);
            toast.success(`Tag "${newTag.name}" berhasil dibuat!`);

        } catch (error: any) {
            toast.dismiss(loadingToast);
            toast.error(error.message || "Gagal membuat tag kustom");
        }
    }
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="animate-spin text-primary-500" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      <GoogleMapsGuideline isOpen={showGuide} onClose={() => setShowGuide(false)} />

      {/* Header Sticky */}
      <div className="bg-white px-6 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-sm">
        <button 
          onClick={() => step === 2 ? setStep(1) : router.back()} 
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-800">
            {step === 1 ? "Tambah Link" : "Lengkapi Info"}
        </h1>
      </div>

      <div className="p-6 max-w-md mx-auto">
        
        {/* --- STEP 1: INPUT LINK --- */}
        <div className={`transition-all duration-500 ${step === 1 ? "block" : "hidden"}`}>
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-primary-100/50 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-peach-light rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary-600 shadow-inner">
                    <Search size={32} />
                </div>
                
                <h2 className="font-bold text-2xl text-gray-800 mb-2">Dapat referensi dari mana?</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                    Tempel link TikTok, Instagram, atau Google Maps. Biar AI kami yang bantu isi datanya.
                </p>
                
                <div className="space-y-4">
                    <Input 
                        icon={<Link2 size={20}/>}
                        placeholder="https://..."
                        value={socialLink}
                        onChange={(e) => setSocialLink(e.target.value)}
                    />
                    
                    <Button 
                        onClick={handleCheckLink} 
                        isLoading={isPreviewLoading} 
                        disabled={!socialLink}
                        className="shadow-lg shadow-primary-200"
                    >
                        Cek Link Ajaib ✨
                    </Button>
                    
                    <div className="relative py-3">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100"></span></div>
                        <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest"><span className="bg-white px-2 text-gray-300">SKIP</span></div>
                    </div>
                    
                    <Button variant="ghost" onClick={() => setStep(2)} className="text-gray-400 font-normal hover:bg-gray-50">
                        Isi Manual Tanpa Link
                    </Button>
                </div>
            </div>
        </div>

        {/* --- STEP 2: FORM LENGKAP --- */}
        <div className={`transition-all duration-500 ${step === 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 hidden"}`}>
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Preview Image */}
                <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                    {previewMeta.meta_image ? (
                        <img 
                            src={previewMeta.meta_image} 
                            alt="Preview" 
                            className="w-full h-full object-contain" 
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-100">
                            <ImageIcon size={32} className="mb-2 opacity-50"/>
                            <span className="text-xs font-medium">Tidak ada gambar preview</span>
                        </div>
                    )}
                    {previewMeta.platform && (
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-md font-bold">
                            Via {previewMeta.platform}
                        </div>
                    )}
                </div>

                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-5">
                    
                    <Input 
                        label="Nama Tempat"
                        placeholder="Contoh: Bakso Pak Kumis"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                    />

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-sm font-medium text-gray-700 ml-1">Link Google Maps (Wajib)</label>
                            <button 
                                type="button" 
                                onClick={() => setShowGuide(true)}
                                className="text-[10px] flex items-center gap-1 text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md font-semibold transition"
                            >
                                <HelpCircle size={10} /> Cara copy?
                            </button>
                        </div>
                        <Input 
                            icon={<MapPin size={18}/>}
                            placeholder="https://maps.app.goo.gl/..."
                            value={formData.maps_link}
                            onChange={(e) => setFormData({...formData, maps_link: e.target.value})}
                            required
                        />
                        <p className="text-[10px] text-gray-400 mt-1 ml-1">*Penting untuk fitur 'Cari Terdekat'</p>
                    </div>

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
                        label="Menu Incaran (Opsional)"
                        placeholder="Misal: Indomie Nyemek"
                        value={formData.target_menu}
                        onChange={(e) => setFormData({...formData, target_menu: e.target.value})}
                    />

                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="block text-sm font-medium text-gray-700 ml-1">Tags</label>
                            <button 
                                type="button" 
                                onClick={handleAddCustomTag}
                                className="text-[10px] flex items-center gap-1 text-primary-600 font-bold hover:text-primary-700 bg-primary-50 px-2 py-1 rounded-md transition"
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
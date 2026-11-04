"use client";

import { useEffect, useState, useRef } from "react";
import { fetchAPI, BASE_URL } from "@/lib/api";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Save } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

export default function EditProfilePage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    display_name: "",
    birth_date: "",
    avatar_url: ""
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // 1. Load Data Awal
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetchAPI("/auth/me");
        setFormData({
            display_name: res.data.display_name || "",
            birth_date: res.data.birth_date ? res.data.birth_date.split('T')[0] : "",
            avatar_url: res.data.avatar_url || ""
        });
        setPreviewUrl(res.data.avatar_url || "");
      } catch (e) { 
        console.error("Gagal load profil:", e);
        toast.error("Gagal mengambil data profil."); 
      }
      finally { setLoading(false); }
    };
    loadProfile();
  }, []);

  // Handle File Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Ukuran foto terlalu besar (Max 5MB)");
            return;
        }
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // 2. Simpan Data
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const loadingToast = toast.loading("Menyimpan perubahan...");

    try {
        let finalAvatarUrl = formData.avatar_url;

        // A. Jika ada file baru, Upload dulu
        if (selectedFile) {
            const uploadData = new FormData();
            uploadData.append("image", selectedFile);
            
            const token = localStorage.getItem("dinery_token");
            if (!token) throw new Error("Sesi habis, silakan login ulang.");

            const uploadRes = await fetch(`${BASE_URL}/storage/upload`, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}` 
                },
                body: uploadData
            });

            const uploadJson = await uploadRes.json();
            
            if (!uploadRes.ok) {
                console.error("Upload Error:", uploadJson);
                throw new Error(uploadJson.message || "Gagal upload gambar ke server");
            }
            
            if (uploadJson.url) {
                finalAvatarUrl = uploadJson.url;
            } else {
                throw new Error("Server tidak mengembalikan URL gambar.");
            }
        }

        // B. Update Data Profile
        await fetchAPI("/auth/profile", {
            method: "PUT",
            body: JSON.stringify({
                display_name: formData.display_name,
                birth_date: formData.birth_date,
                avatar_url: finalAvatarUrl
            })
        });

        // C. Perbarui context agar foto & nama di Header Home & Profile langsung terupdate
        await refreshProfile();

        toast.dismiss(loadingToast);
        toast.success("Profil berhasil diperbarui!");
        
        router.back(); 
        
    } catch (err: any) {
        console.error("Save Error:", err);
        toast.dismiss(loadingToast);
        toast.error(err.message || "Gagal menyimpan perubahan.");
    } finally {
        setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-500 min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">Loading...</div>;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-24 transition-colors">
      <div className="px-6 py-4 flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10 transition-colors">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">Edit Profil</h1>
      </div>

      <div className="p-6">
        <form onSubmit={handleSave} className="space-y-6">
            
            {/* Avatar Section */}
            <div className="flex flex-col items-center">
                <div 
                    className="relative w-28 h-28 rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-700 shadow-lg overflow-hidden group cursor-pointer" 
                    onClick={() => fileInputRef.current?.click()}
                >
                    {previewUrl ? (
                        <img src={previewUrl} className="w-full h-full object-cover" alt="Preview Avatar" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Photo</div>
                    )}
                    
                    {/* Overlay Icon */}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <Camera className="text-white" />
                    </div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                <p className="text-xs text-primary-500 mt-2 font-medium">Ketuk untuk ganti foto</p>
            </div>

            <Input 
                label="Nama Panggilan"
                value={formData.display_name}
                onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                placeholder="Nama kamu"
            />

            <Input 
                label="Tanggal Lahir"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
            />

            <Button type="submit" isLoading={saving}>
                <Save size={18} className="mr-2"/> Simpan Perubahan
            </Button>
        </form>
      </div>
    </div>
  );
}

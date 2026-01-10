"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Copy, Save, User, Loader2, Share2, Mail } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button"; // Gunakan Button component kita
import { CoupleStatusResponse } from "@/types";
import { useAuth } from "@/context/AuthContext"; // Import useAuth for current user data

export default function CoupleManagementPage() {
  const router = useRouter();
  const { user } = useAuth(); // Get current user data
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State Data sesuai response API
  const [coupleInfo, setCoupleInfo] = useState<CoupleStatusResponse | null>(null);
  const [coupleName, setCoupleName] = useState("");

  // 1. GET Status Couple
  useEffect(() => {
    loadCoupleData();
  }, []);

  const loadCoupleData = async () => {
    try {
      const res = await fetchAPI("/couples/my-status");
      
      // Validasi Response
      if (res.has_couple && res.couple_data) {
        setCoupleInfo(res);
        setCoupleName(res.couple_data.name || "Couple Kita");
      } else {
        alert("Kamu belum terhubung dengan pasangan!");
        router.push("/onboarding");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal memuat data couple.");
    } finally {
      setLoading(false);
    }
  };

  // 2. PUT Update Name
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchAPI("/couples", {
        method: "PUT",
        body: JSON.stringify({ name: coupleName }),
      });
      alert("Yeay! Nama couple berhasil diubah ❤️");
      loadCoupleData(); // Refresh data
    } catch (err) {
      alert("Gagal mengupdate nama.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCode = () => {
    const code = coupleInfo?.couple_data?.invite_code;
    if (code) {
        navigator.clipboard.writeText(code);
        alert("Kode berhasil disalin!");
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-2">
            <Loader2 className="animate-spin text-primary-500" />
            <p className="text-xs text-gray-400">Mengambil data cinta...</p>
        </div>
    );
  }

  // Helper untuk data pasangan
  const partner = coupleInfo?.partner_data;
  const couple = coupleInfo?.couple_data;

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Manajemen Pasangan</h1>
      </div>

      {/* Card Utama: Edit Nama */}
      <div className="bg-white rounded-3xl p-6 shadow-lg shadow-primary-500/5 border border-primary-100 mb-6 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -mr-10 -mt-10 blur-2xl"></div>
         <div className="absolute bottom-0 left-0 w-24 h-24 bg-peach-light/30 rounded-full -ml-8 -mb-8 blur-xl"></div>
         
         <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white mb-4 shadow-xl shadow-primary-200">
                <Heart size={36} fill="currentColor" className="animate-pulse" />
            </div>
            
            <h2 className="text-xs text-gray-400 font-bold mb-3 uppercase tracking-wider">Nama Hubungan Kalian</h2>
            
            <form onSubmit={handleUpdateName} className="w-full">
                <div className="flex gap-2 items-center">
                    <div className="flex-1">
                        <Input 
                            value={coupleName} 
                            onChange={(e) => setCoupleName(e.target.value)}
                            className="text-center font-bold text-lg bg-gray-50 focus:bg-white border-transparent focus:border-primary-200 shadow-inner"
                            placeholder="Contoh: Rangga & Cinta"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="p-3.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition disabled:opacity-70 shadow-lg shadow-primary-200 active:scale-95"
                        title="Simpan Perubahan"
                    >
                        {saving ? <Loader2 size={20} className="animate-spin"/> : <Save size={20}/>}
                    </button>
                </div>
            </form>
         </div>
      </div>

      {/* Card Invite Code */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
         <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="font-bold text-gray-800">Kode Undangan</h3>
                <p className="text-xs text-gray-400">Kode unik hubungan kalian.</p>
            </div>
            <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                <Share2 size={18} />
            </div>
         </div>
         
         <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300 flex justify-between items-center group hover:border-primary-300 transition cursor-pointer" onClick={handleCopyCode}>
            <span className="text-3xl font-mono font-black tracking-widest text-gray-700 group-hover:text-primary-600 transition select-all">
                {couple?.invite_code || "ERROR"}
            </span>
            <button 
                className="p-2 text-gray-400 hover:text-primary-500 hover:bg-white rounded-lg transition"
                title="Salin Kode"
            >
                <Copy size={20} />
            </button>
         </div>
         <p className="text-[10px] text-gray-400 mt-3 text-center">
            Gunakan kode ini jika pasanganmu perlu login ulang atau berganti device.
         </p>
      </div>

      {/* Info Anggota (Updated Logic with Avatars) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
         <h3 className="font-bold text-gray-800 mb-4">Anggota Couple</h3>
         <div className="space-y-4">
            {/* User Sendiri */}
            <div className="flex items-center gap-3 pb-3 border-b border-gray-50">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold border-2 border-primary-200 overflow-hidden">
                    {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="You" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-lg">{user?.display_name?.charAt(0) || "U"}</span>
                    )}
                </div>
                <div>
                    <p className="font-bold text-gray-800 text-sm">Kamu ({coupleInfo?.role === 'creator' ? 'Creator' : 'Joiner'})</p>
                    <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold">Online</span>
                </div>
            </div>
            
            {/* Pasangan (Logic Partner Data) */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center text-pink-400 border-2 border-pink-100 overflow-hidden">
                    {partner?.avatar_url ? (
                        <img src={partner.avatar_url} alt="Partner" className="w-full h-full object-cover" />
                    ) : (
                        <Heart size={20} />
                    )}
                </div>
                <div className="flex-1">
                    {partner ? (
                        <>
                            <p className="font-bold text-gray-800 text-sm">{partner.display_name || "Pasanganmu"}</p>
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                                <Mail size={10} /> {partner.email}
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="font-bold text-gray-400 text-sm">Belum ada pasangan</p>
                            <span className="text-[10px] text-gray-400">Bagikan kode invite di atas!</span>
                        </>
                    )}
                </div>
                {partner && (
                    <span className="text-[10px] bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full font-bold">Joined</span>
                )}
            </div>
         </div>
      </div>

    </div>
  );
}
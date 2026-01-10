"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { LogOut, Heart, User, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="p-6 pb-24">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Profil Saya</h1>

      <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl p-6 text-white shadow-xl shadow-primary-200 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
        
        <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-primary-500 text-2xl font-bold shadow-md border-4 border-white/20 overflow-hidden">
                {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    user?.display_name?.charAt(0) || "U"
                )}
            </div>
            <div>
                <h2 className="text-xl font-bold">{user?.display_name}</h2>
                <p className="text-primary-100 text-sm">{user?.email}</p>
            </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex items-center gap-3 border border-white/10">
            <Heart size={20} className="text-pink-300" fill="currentColor"/>
            <div>
                <p className="text-xs text-primary-100">Status Hubungan</p>
                <p className="font-semibold text-sm">Terhubung ❤️</p>
            </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Menu Edit Profil */}
        <Link href="/profile/edit" className="block">
            <button className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition group">
                <div className="flex items-center gap-3 text-gray-700">
                    <div className="p-2 bg-blue-50 text-blue-500 rounded-lg group-hover:bg-blue-100 transition"><User size={20}/></div>
                    <span className="font-medium text-sm">Edit Data Diri</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
            </button>
        </Link>
        
        {/* Menu Manajemen Pasangan */}
        <Link href="/profile/couple" className="block">
            <button className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition group">
                <div className="flex items-center gap-3 text-gray-700">
                    <div className="p-2 bg-pink-50 text-pink-500 rounded-lg group-hover:bg-pink-100 transition"><Heart size={20}/></div>
                    <span className="font-medium text-sm">Manajemen Pasangan</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
            </button>
        </Link>

        {/* Menu Pengaturan DIHAPUS sesuai request */}

        <div className="pt-6">
            <Button variant="outline" onClick={logout} className="border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 w-full justify-center">
                <LogOut size={18} className="mr-2"/> Keluar Aplikasi
            </Button>
        </div>
      </div>
      
      <p className="text-center text-xs text-gray-300 mt-10">Versi 1.0.0 • Dinery App</p>
    </div>
  );
}
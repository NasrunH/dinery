"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { LogOut, Heart, User, ChevronRight, Moon, Sun } from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";
import { useTheme } from "next-themes";

export default function ProfilePage() {
  const { user, logout, checkCoupleStatus } = useAuth();
  const { theme, setTheme } = useTheme();
  const [hasCouple, setHasCouple] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkStatus = async () => {
      const status = await checkCoupleStatus();
      setHasCouple(status);
      setLoadingStatus(false);
    };
    checkStatus();
    checkStatus();
  }, [checkCoupleStatus]);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Yakin mau keluar?',
      text: "Sesi kamu akan berakhir.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#e5e7eb',
      cancelButtonText: '<span style="color: #374151">Batal</span>',
      confirmButtonText: 'Ya, Keluar'
    });

    if (result.isConfirmed) {
      logout();
    }
  };

  return (
    <div className="p-6 pb-24 dark:bg-gray-950 min-h-screen transition-colors">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-8">Profil Saya</h1>

      <div className="bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-800 rounded-3xl p-6 text-white shadow-xl shadow-primary-200 dark:shadow-none mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
        
        <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-primary-500 dark:text-primary-400 text-2xl font-bold shadow-md border-4 border-white/20 dark:border-gray-700/50 overflow-hidden">
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
                <p className="font-semibold text-sm">
                    {loadingStatus ? "Mengecek..." : hasCouple ? "Terhubung ❤️" : "Belum Terhubung"}
                </p>
            </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Menu Edit Profil */}
        <Link href="/profile/edit" className="block">
            <button className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition group">
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition"><User size={20}/></div>
                    <span className="font-medium text-sm">Edit Data Diri</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />
            </button>
        </Link>
        
        {/* Menu Manajemen Pasangan */}
        <Link href="/profile/couple" className="block">
            <button className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition group">
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                    <div className="p-2 bg-pink-50 dark:bg-pink-900/30 text-pink-500 dark:text-pink-400 rounded-lg group-hover:bg-pink-100 dark:group-hover:bg-pink-900/50 transition"><Heart size={20}/></div>
                    <span className="font-medium text-sm">Manajemen Pasangan</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />
            </button>
        </Link>

        {/* Menu Tema */}
        {mounted && (
            <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition group"
            >
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-500 dark:text-purple-400 rounded-lg group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition">
                        {theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}
                    </div>
                    <span className="font-medium text-sm">Mode {theme === 'dark' ? 'Terang' : 'Gelap'}</span>
                </div>
            </button>
        )}

        <div className="pt-6">
            <Button variant="outline" onClick={handleLogout} className="border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 w-full justify-center">
                <LogOut size={18} className="mr-2"/> Keluar Aplikasi
            </Button>
        </div>
      </div>
      
      <p className="text-center text-xs text-gray-300 mt-10">Versi 1.0.0 • Dinery App</p>
    </div>
  );
}
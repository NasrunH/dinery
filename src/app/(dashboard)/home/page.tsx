"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Bell, MapPin, Plus, Dice5 } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { user } = useAuth();
  const [coupleName, setCoupleName] = useState("");

  useEffect(() => {
    const fetchCouple = async () => {
        try {
            const res = await fetchAPI("/couples/my-status");
            // Handle variasi response BE (kadang di root, kadang di couple_data)
            if (res.data) setCoupleName(res.data.name);
            else if (res.couple_data) setCoupleName(res.couple_data.name);
        } catch (e) { console.error(e) }
    };
    fetchCouple();
  }, []);

  return (
    <div className="pb-24">
      {/* Header Modern */}
      <div className="bg-white px-6 pt-8 pb-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold border border-primary-200 overflow-hidden">
                {/* Tampilkan Avatar dari Backend */}
                {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    user?.display_name?.charAt(0) || "U"
                )}
            </div>
            <div>
              <p className="text-xs text-gray-400">Selamat datang, {user?.display_name}</p>
              <h2 className="text-lg font-bold text-gray-800">
                {coupleName ? `Ruang ${coupleName}` : "Ruang Couple"}
              </h2>
            </div>
          </div>
          <button className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition relative">
            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
            <Bell size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Hero Section */}
        <div className="bg-primary-500 rounded-3xl p-6 text-white shadow-xl shadow-primary-200 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-10 w-32 h-32 bg-white/20 rounded-full blur-xl"></div>
            <div className="relative z-10">
                <p className="text-primary-100 text-sm mb-1">Mulai Petualangan</p>
                <h1 className="text-2xl font-bold mb-4">Mau makan dimana?</h1>
                <div className="flex gap-2">
                    <Link href="/wishlist/add" className="px-4 py-2 bg-white text-primary-600 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition">
                        + Tambah Baru
                    </Link>
                    <Link href="/wishlist" className="px-4 py-2 bg-white/20 text-white rounded-xl text-xs font-bold backdrop-blur-sm hover:bg-white/30 transition">
                        Lihat Wishlist
                    </Link>
                </div>
            </div>
        </div>
      </div>

      {/* Action Grid */}
      <div className="px-6 py-4">
        <h3 className="font-bold text-gray-800 mb-4 text-sm">Jalan Pintas</h3>
        <div className="grid grid-cols-3 gap-3">
            <Link href="/wishlist" className="aspect-square bg-peach-light/30 rounded-2xl flex flex-col items-center justify-center gap-2 border border-peach-light/50 hover:bg-peach-light/50 transition">
                <div className="p-2 bg-white rounded-full shadow-sm text-primary-500"><Plus size={20}/></div>
                <span className="text-xs font-medium text-gray-700">Wishlist</span>
            </Link>
            <button className="aspect-square bg-blue-50 rounded-2xl flex flex-col items-center justify-center gap-2 border border-blue-100 hover:bg-blue-100/50 transition">
                <div className="p-2 bg-white rounded-full shadow-sm text-blue-500"><MapPin size={20}/></div>
                <span className="text-xs font-medium text-gray-700">Terdekat</span>
            </button>
            <button className="aspect-square bg-purple-50 rounded-2xl flex flex-col items-center justify-center gap-2 border border-purple-100 hover:bg-purple-100/50 transition">
                <div className="p-2 bg-white rounded-full shadow-sm text-purple-500"><Dice5 size={20}/></div>
                <span className="text-xs font-medium text-gray-700">Gacha</span>
            </button>
        </div>
      </div>
    </div>
  );
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, History, User } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  // --- LOGIC: AUTO-HIDE NAVIGATION ---
  // Sembunyikan menu jika sedang di halaman:
  // 1. Tambah Wishlist (/wishlist/add)
  // 2. Detail Wishlist (/wishlist/123) -> pola /wishlist/ + sesuatu
  
  const shouldHideNav = 
    pathname === "/wishlist/add" || 
    (pathname.startsWith("/wishlist/") && pathname !== "/wishlist");

  // Jika kondisi terpenuhi, jangan render apa-apa (Menu Hilang)
  if (shouldHideNav) return null;

  const navItems = [
    { name: "Home", href: "/home", icon: Home },
    { name: "Wishlist", href: "/wishlist", icon: Heart },
    { name: "History", href: "/history", icon: History },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-5 pt-3 px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                isActive ? "text-primary-500 -translate-y-1" : "text-gray-400 hover:text-primary-300"
              }`}
            >
              <Icon size={isActive ? 24 : 22} fill={isActive ? "currentColor" : "none"} strokeWidth={2.5} />
              <span className={`text-[10px] font-medium ${isActive ? "opacity-100" : "opacity-0 hidden"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
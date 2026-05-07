"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Heart, Map, User, History } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  // Hide nav on auth pages, onboarding, or detail pages
  const isDetailPage = pathname.startsWith("/wishlist/") && pathname.split("/").length > 2;
  if (["/login", "/register", "/onboarding"].includes(pathname) || isDetailPage) return null;

  const navItems = [
    { name: "Home", href: "/home", icon: Home },
    { name: "Wishlist", href: "/wishlist", icon: Heart },
    { name: "Peta", href: "/maps", icon: Map },
    { name: "Riwayat", href: "/history", icon: History },
    { name: "Profil", href: "/profile", icon: User },
  ];

  return (
    // PERBAIKAN: z-30 agar di bawah Modal (biasanya z-50 atau z-100)
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-6 py-3 pb-6 flex justify-between items-center z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] transition-colors">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        
        return (
          <Link key={item.name} href={item.href} className="flex flex-col items-center gap-1 min-w-[3.5rem]">
            <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? "bg-primary-50 dark:bg-primary-900/30 text-primary-500 scale-110" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} fill={isActive && item.name === "Wishlist" ? "currentColor" : "none"} />
            </div>
            {isActive && (
                <span className="text-[9px] font-bold text-primary-600 dark:text-primary-400 animate-in fade-in slide-in-from-bottom-1 duration-300">
                    {item.name}
                </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import { Notification } from "@/types";
import { 
  ArrowLeft, BellOff, Bookmark, Star, Info, CheckCircle2 
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // --- HELPER: Time Ago ---
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Baru saja";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} hari yang lalu`;
    return date.toLocaleDateString('id-ID');
  };

  // --- INIT DATA ---
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetchAPI("/notifications");
        setNotifications(res.data || []);
      } catch (err) {
        console.error("Gagal load notifikasi", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  // --- HANDLER: Click Notif ---
  const handleNotificationClick = async (notif: Notification) => {
    // 1. Optimistic UI Update (Langsung jadi read di tampilan)
    setNotifications((prev) => 
      prev.map((n) => n.id === notif.id ? { ...n, is_read: true } : n)
    );

    try {
        // 2. Call API Mark as Read
        await fetchAPI(`/notifications/${notif.id}/read`, {
            method: "PUT"
        });
    } catch (e) {
        console.error("Gagal update status read", e);
    }

    // 3. Routing Logic
    if (notif.type === "wishlist" && notif.related_id) {
        router.push(`/wishlist/${notif.related_id}`);
    } else if (notif.type === "journal" && notif.related_id) {
        router.push(`/wishlist/${notif.related_id}`);
    }
  };

  // --- RENDER ICON BASED ON TYPE ---
  const renderIcon = (type: string) => {
    switch (type) {
        case "wishlist":
            return (
              <div className="p-2.5 bg-pink-50 dark:bg-pink-950/40 rounded-xl text-pink-500 border border-pink-100 dark:border-pink-900/40">
                <Bookmark size={18} fill="currentColor" />
              </div>
            );
        case "journal":
            return (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-500 border border-amber-100 dark:border-amber-900/40">
                <Star size={18} fill="currentColor" />
              </div>
            );
        default: // system
            return (
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-500 border border-blue-100 dark:border-blue-900/40">
                <Info size={18} />
              </div>
            );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24 transition-colors max-w-md mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center gap-4 shadow-sm transition-colors">
        <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition text-gray-700 dark:text-gray-300">
            <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-bold text-gray-800 dark:text-gray-100">Update Terkini</h1>
      </div>

      {/* List Content */}
      <div className="p-4">
        {loading ? (
           <div className="space-y-3">
               {[1, 2, 3, 4].map(i => (
                   <div key={i} className="flex gap-4 p-4 border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl shadow-sm">
                       <Skeleton className="w-10 h-10 rounded-xl" />
                       <div className="flex-1 space-y-2">
                           <Skeleton className="h-4 w-3/4 rounded-md" />
                           <Skeleton className="h-3 w-1/2 rounded-md" />
                       </div>
                   </div>
               ))}
           </div>
        ) : notifications.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-center px-6">
               <div className="w-20 h-20 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl flex items-center justify-center mb-4 shadow-sm">
                   <BellOff size={32} className="text-gray-400 dark:text-gray-500" />
               </div>
               <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1 text-sm">Belum ada kabar</h3>
               <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs leading-relaxed">
                 Tenang, nanti kalau doi nambahin wishlist atau review, bakal muncul di sini kok.
               </p>
           </div>
        ) : (
           <div className="space-y-3">
               {notifications.map((notif) => (
                   <div 
                      key={notif.id} 
                      onClick={() => handleNotificationClick(notif)}
                      className={`
                        relative flex gap-3.5 p-4 rounded-2xl border transition cursor-pointer active:scale-[0.99] shadow-sm
                        ${notif.is_read 
                            ? "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700" 
                            : "bg-blue-50/70 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40 ring-1 ring-blue-100/50 dark:ring-blue-900/30"
                        }
                      `}
                   >
                       {/* Unread Indicator Dot */}
                       {!notif.is_read && (
                           <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                       )}

                       <div className="shrink-0 pt-0.5">
                           {renderIcon(notif.type)}
                       </div>

                       <div className="flex-1">
                           <div className="flex justify-between items-start mb-1 pr-4">
                               <h4 className={`text-xs ${notif.is_read ? 'font-semibold text-gray-700 dark:text-gray-200' : 'font-bold text-gray-900 dark:text-gray-100'}`}>
                                   {notif.title}
                               </h4>
                           </div>
                           <p className={`text-xs mb-2 leading-relaxed ${notif.is_read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                               {notif.message}
                           </p>
                           <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                               {formatTimeAgo(notif.created_at)}
                           </p>
                       </div>
                   </div>
               ))}
           </div>
        )}
      </div>
    </div>
  );
}
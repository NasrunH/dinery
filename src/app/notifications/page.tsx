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
        // Asumsi endpoint menerima method PUT
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
        // Bisa diarahkan ke detail place
        router.push(`/wishlist/${notif.related_id}`);
    } else {
        // Type system atau tidak ada related_id
        // Tidak perlu redirect, hanya update status
    }
  };

  // --- RENDER ICON BASED ON TYPE ---
  const renderIcon = (type: string) => {
    switch (type) {
        case "wishlist":
            return <div className="p-2 bg-pink-100 rounded-full text-pink-500"><Bookmark size={20} fill="currentColor" /></div>;
        case "journal":
            return <div className="p-2 bg-yellow-100 rounded-full text-yellow-500"><Star size={20} fill="currentColor" /></div>;
        default: // system
            return <div className="p-2 bg-blue-100 rounded-full text-blue-500"><Info size={20} /></div>;
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 shadow-sm">
        <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition">
            <ArrowLeft size={24} className="text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Update Terkini</h1>
      </div>

      {/* List Content */}
      <div className="p-4">
        {loading ? (
           <div className="space-y-4">
               {[1,2,3].map(i => (
                   <div key={i} className="flex gap-4 p-4 border border-gray-100 rounded-xl">
                       <Skeleton className="w-10 h-10 rounded-full" />
                       <div className="flex-1 space-y-2">
                           <Skeleton className="h-4 w-3/4" />
                           <Skeleton className="h-3 w-1/2" />
                       </div>
                   </div>
               ))}
           </div>
        ) : notifications.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-center px-6">
               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                   <BellOff size={32} className="text-gray-300" />
               </div>
               <h3 className="font-bold text-gray-800 mb-2">Belum ada kabar</h3>
               <p className="text-sm text-gray-400">Tenang, nanti kalau doi nambahin wishlist atau review, bakal muncul di sini kok.</p>
           </div>
        ) : (
           <div className="space-y-3">
               {notifications.map((notif) => (
                   <div 
                      key={notif.id} 
                      onClick={() => handleNotificationClick(notif)}
                      className={`
                        relative flex gap-4 p-4 rounded-xl border transition cursor-pointer active:scale-[0.99]
                        ${notif.is_read 
                            ? "bg-white border-gray-100" 
                            : "bg-blue-50/50 border-blue-100 ring-1 ring-blue-50"
                        }
                      `}
                   >
                       {/* Unread Indicator Dot */}
                       {!notif.is_read && (
                           <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full"></div>
                       )}

                       <div className="shrink-0">
                           {renderIcon(notif.type)}
                       </div>

                       <div className="flex-1">
                           <div className="flex justify-between items-start mb-1 pr-4">
                               <h4 className={`text-sm ${notif.is_read ? 'font-semibold text-gray-700' : 'font-bold text-gray-900'}`}>
                                   {notif.title}
                               </h4>
                           </div>
                           <p className={`text-xs mb-2 leading-relaxed ${notif.is_read ? 'text-gray-500' : 'text-gray-700'}`}>
                               {notif.message}
                           </p>
                           <p className="text-[10px] text-gray-400 font-medium">
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
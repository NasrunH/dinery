"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

export default function SplashScreen() {
  const { user, loading, checkCoupleStatus } = useAuth();
  const router = useRouter();
  const hasNavigated = useRef(false);

  useEffect(() => {
    // Tunggu sampai auth selesai menginisialisasi
    if (loading || hasNavigated.current) return;

    let isMounted = true;

    const navigate = async () => {
      hasNavigated.current = true;

      // 1. Jika belum login, alihkan langsung ke /login (0ms)
      if (!user) {
        router.replace("/login");
        return;
      }

      // 2. Jika sudah login, cek status couple dengan timeout guard (maks 3 detik)
      try {
        const timeoutPromise = new Promise<boolean>((resolve) => 
          setTimeout(() => resolve(true), 3000)
        );
        const hasCouple = await Promise.race([checkCoupleStatus(), timeoutPromise]);

        if (isMounted) {
          router.replace(hasCouple ? "/home" : "/onboarding");
        }
      } catch {
        if (isMounted) {
          router.replace("/home");
        }
      }
    };

    navigate();

    return () => {
      isMounted = false;
    };
  }, [user, loading, router, checkCoupleStatus]);

  return (
    <div className="min-h-screen bg-primary-50 dark:bg-gray-950 flex flex-col items-center justify-center text-primary-500 transition-colors">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <Heart size={64} fill="currentColor" className="text-primary-500 filter drop-shadow-lg" />
        <h1 className="text-3xl font-extrabold tracking-widest text-primary-600 dark:text-primary-400">DINERY</h1>
        <p className="text-xs font-medium text-primary-400 dark:text-primary-500/80 tracking-wide">Teman Kuliner Berdua</p>
      </div>
    </div>
  );
}

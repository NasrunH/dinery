"use client";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

export default function SplashScreen() {
  const { user, loading, checkCoupleStatus } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(async () => {
      if (!user) {
        router.replace("/login");
      } else {
        const hasCouple = await checkCoupleStatus();
        router.replace(hasCouple ? "/home" : "/onboarding");
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [user, loading, router, checkCoupleStatus]);

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center text-primary-500">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <Heart size={64} fill="currentColor" />
        <h1 className="text-3xl font-bold tracking-widest">DINERY</h1>
      </div>
    </div>
  );
}
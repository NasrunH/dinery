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
    if (loading || hasNavigated.current) return;

    let isMounted = true;

    const navigate = async () => {
      hasNavigated.current = true;
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const hasCouple = await checkCoupleStatus();
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
        <Heart size={64} fill="currentColor" />
        <h1 className="text-3xl font-bold tracking-widest text-primary-600 dark:text-primary-400">DINERY</h1>
      </div>
    </div>
  );
}

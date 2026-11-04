"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { fetchAPI } from "@/lib/api";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string; 
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, refresh_token: string, userData: User, redirectPath?: string) => void;
  logout: () => void;
  checkCoupleStatus: () => Promise<boolean>;
  refreshProfile: () => Promise<void>; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    localStorage.removeItem("dinery_token");
    localStorage.removeItem("dinery_refresh_token");
    setUser(null);
    router.push("/login");
  }, [router]);

  // Fungsi fetch data user terbaru
  const initAuth = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("dinery_token") : null;
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("dinery_refresh_token") : null;

    if (token) {
      try {
        const res = await fetchAPI("/auth/me", { skipAuthRedirect: true } as any);
        setUser(res.data);
      } catch (error: any) {
        // Jika token expired (401), coba refresh
        if (refreshToken) {
          try {
             const refreshRes = await fetchAPI("/auth/refresh", {
                method: "POST",
                body: JSON.stringify({ refresh_token: refreshToken }),
                skipAuthRedirect: true
             } as any);
             localStorage.setItem("dinery_token", refreshRes.token);
             localStorage.setItem("dinery_refresh_token", refreshRes.refresh_token);
             
             // Cek profil lagi dengan token baru
             const retryRes = await fetchAPI("/auth/me", { skipAuthRedirect: true } as any);
             setUser(retryRes.data);
          } catch (refreshError) {
             logout();
          }
        } else {
          logout();
        }
      }
    }
    setLoading(false);
  }, [logout]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = useCallback((token: string, refresh_token: string, userData: User, redirectPath?: string) => {
    localStorage.setItem("dinery_token", token);
    localStorage.setItem("dinery_refresh_token", refresh_token);
    setUser(userData);
    if (redirectPath !== undefined) {
      if (redirectPath) router.push(redirectPath);
    } else {
      router.push("/");
    }
  }, [router]);

  const checkCoupleStatus = useCallback(async () => {
    try {
      const res = await fetchAPI("/couples/my-status");
      return !!res.has_couple;
    } catch {
      return false;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await initAuth();
  }, [initAuth]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkCoupleStatus, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

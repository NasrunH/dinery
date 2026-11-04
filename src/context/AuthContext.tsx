"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { fetchAPI } from "@/lib/api";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  birth_date?: string;
  phone?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, refresh_token: string, userData: User, redirectPath?: string) => void;
  logout: () => void;
  checkCoupleStatus: () => Promise<boolean>;
  refreshProfile: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. Logout: Hapus token, reset user state, dan redirect ke /login
  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("dinery_token");
      localStorage.removeItem("dinery_refresh_token");
    }
    setUser(null);
    router.replace("/login");
  }, [router]);

  // 2. InitAuth: Mengambil user profile & memulihkan sesi via refresh token jika perlu
  const initAuth = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("dinery_token") : null;
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("dinery_refresh_token") : null;

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetchAPI("/auth/me", { skipAuthRedirect: true } as any);
      setUser(res.data);
    } catch (error: any) {
      // Jika token expired (401), coba pulihkan dengan refresh token
      if (refreshToken) {
        try {
          const refreshRes = await fetchAPI("/auth/refresh", {
            method: "POST",
            body: JSON.stringify({ refresh_token: refreshToken }),
            skipAuthRedirect: true
          } as any);

          if (refreshRes?.token) {
            localStorage.setItem("dinery_token", refreshRes.token);
            if (refreshRes.refresh_token) {
              localStorage.setItem("dinery_refresh_token", refreshRes.refresh_token);
            }

            // Coba ambil profil dengan token baru
            const retryRes = await fetchAPI("/auth/me", { skipAuthRedirect: true } as any);
            setUser(retryRes.data);
          } else {
            logout();
          }
        } catch {
          logout();
        }
      } else {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // 3. Login: Simpan token, update state user, dan redirect ke tujuan
  const login = useCallback((token: string, refresh_token: string, userData: User, redirectPath?: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("dinery_token", token);
      if (refresh_token) {
        localStorage.setItem("dinery_refresh_token", refresh_token);
      }
    }
    setUser(userData);
    
    // Gunakan router.replace agar /login tidak tertinggal di riwayat tombol Back browser
    const target = redirectPath || "/";
    router.replace(target);
  }, [router]);

  // 4. CheckCoupleStatus: Cek apakah user sudah memiliki pasangan aktif
  const checkCoupleStatus = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetchAPI("/couples/my-status");
      return Boolean(res?.has_couple);
    } catch {
      return false;
    }
  }, []);

  // 5. RefreshProfile: Memperbarui data profil terbaru secara instan (mengembalikan user terbaru)
  const refreshProfile = useCallback(async (): Promise<User | null> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("dinery_token") : null;
    if (!token) return null;

    try {
      const res = await fetchAPI("/auth/me", { skipAuthRedirect: true } as any);
      const updatedUser: User = res?.data || null;
      if (updatedUser) {
        setUser(updatedUser);
      }
      return updatedUser;
    } catch (err) {
      console.error("Gagal refresh profil:", err);
      return null;
    }
  }, []);

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

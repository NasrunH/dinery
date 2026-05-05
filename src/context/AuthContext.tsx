"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { fetchAPI } from "@/lib/api";
import { useRouter } from "next/navigation";

// Update Interface User: Tambahkan avatar_url
interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string; 
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, refresh_token: string, userData: User) => void;
  logout: () => void;
  checkCoupleStatus: () => Promise<boolean>;
  refreshProfile: () => Promise<void>; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fungsi fetch data user terbaru
  const initAuth = async () => {
    const token = localStorage.getItem("dinery_token");
    const refreshToken = localStorage.getItem("dinery_refresh_token");

    if (token) {
      try {
        const res = await fetchAPI("/auth/me");
        setUser(res.data);
      } catch (error: any) {
        // Jika token expired (401), coba refresh
        if (refreshToken) {
          try {
             const refreshRes = await fetchAPI("/auth/refresh", {
                method: "POST",
                body: JSON.stringify({ refresh_token: refreshToken })
             });
             localStorage.setItem("dinery_token", refreshRes.token);
             localStorage.setItem("dinery_refresh_token", refreshRes.refresh_token);
             
             // Cek profil lagi dengan token baru
             const retryRes = await fetchAPI("/auth/me");
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
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = (token: string, refresh_token: string, userData: User) => {
    localStorage.setItem("dinery_token", token);
    localStorage.setItem("dinery_refresh_token", refresh_token);
    setUser(userData);
    router.push("/");
  };

  const logout = () => {
    localStorage.removeItem("dinery_token");
    localStorage.removeItem("dinery_refresh_token");
    setUser(null);
    router.push("/login");
  };

  const checkCoupleStatus = async () => {
    try {
      const res = await fetchAPI("/couples/my-status");
      return res.has_couple;
    } catch {
      return false;
    }
  };

  // Panggil ini setelah update profile agar foto di header berubah
  const refreshProfile = async () => {
    await initAuth();
  };

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
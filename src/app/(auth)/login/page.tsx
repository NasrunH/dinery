"use client";

import { useState, useEffect, Suspense } from "react";
import { fetchAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  
  const { user, loading, login } = useAuth();

  // Jika user sudah login, langsung alihkan ke halaman tujuan atau home
  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectParam || "/home");
    }
  }, [user, loading, router, redirectParam]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const loadingToast = toast.loading("Sedang masuk...");

    try {
      // 1. Hit API Login (Dapatkan Token & Refresh Token)
      const loginRes = await fetchAPI("/auth/login", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      const token = loginRes?.token;
      const refreshToken = loginRes?.refresh_token;

      if (!token) {
        throw new Error("Token autentikasi tidak ditemukan.");
      }

      // 2. Paralelisasi request /auth/me dan /couples/my-status (Anti-Waterfall & Instan)
      const authHeaders = { Authorization: `Bearer ${token}` };
      const [meResult, coupleResult] = await Promise.allSettled([
        fetchAPI("/auth/me", { headers: authHeaders }),
        fetchAPI("/couples/my-status", { headers: authHeaders })
      ]);

      const meData = meResult.status === "fulfilled" ? meResult.value : null;
      const coupleData = coupleResult.status === "fulfilled" ? coupleResult.value : null;

      // Normalisasi data user & status pasangan
      const userData = meData?.data || meData?.user || meData || { id: "", email: formData.email };
      const hasCouple = Boolean(coupleData?.has_couple);

      // Tentukan tujuan redirect
      let destination = redirectParam;
      if (!destination) {
        destination = hasCouple ? "/home" : "/onboarding";
      }

      toast.dismiss(loadingToast);
      toast.success(`Selamat datang, ${userData.display_name || 'Kak'}!`);

      // 3. Simpan sesi & redirect langsung menggunakan router.replace via login()
      login(token, refreshToken, userData, destination);

    } catch (err: any) {
      toast.dismiss(loadingToast);

      // UI Error Handling
      setTimeout(() => {
        if (
          err.error === "Email not confirmed" || 
          err.message === "Email not confirmed" ||
          (err.message && err.message.includes("Email not confirmed"))
        ) {
          Swal.fire({
            title: 'Verifikasi Email Dulu Yuk!',
            html: `
              <div class="text-gray-600 dark:text-gray-300">
                <p class="mb-3">Akunmu sudah ada, tapi belum aktif.</p>
                <div class="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-lg border border-blue-100 dark:border-blue-900/40 text-sm text-blue-700 dark:text-blue-300 mb-2">
                   Silakan cek inbox/spam di <b>${formData.email}</b> dan klik link konfirmasinya.
                </div>
              </div>
            `,
            icon: 'info',
            confirmButtonText: 'Oke, Saya Cek Sekarang',
            confirmButtonColor: '#0ea5e9',
            focusConfirm: true,
            allowOutsideClick: false
          });
        } else {
          toast.error(err.message || "Email atau password salah");
        }
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-8 bg-white dark:bg-gray-950 max-w-md mx-auto transition-colors">
      <div className="mb-10 text-center">
        <div className="inline-flex p-3 bg-primary-50 dark:bg-primary-950/50 rounded-full mb-4 animate-bounce">
            <Heart className="text-primary-500" size={32} fill="currentColor" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Selamat Datang</h1>
        <p className="text-gray-500 dark:text-gray-400">Masuk untuk terhubung dengan pasanganmu</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <Input
            label="Email"
            type="email"
            placeholder="nama@email.com"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
            autoFocus
        />

        <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
        />

        <Button type="submit" isLoading={isLoading} className="w-full">
          Masuk Sekarang
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Belum punya akun?{" "}
        <Link href="/register" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
          Daftar Dulu
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <Heart className="text-primary-500 w-10 h-10 animate-pulse" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

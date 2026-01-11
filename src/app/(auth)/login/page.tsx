"use client";

import { useState } from "react";
import { fetchAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const loadingToast = toast.loading("Sedang masuk...");

    try {
      // 1. Hit API Login (Dapatkan Token)
      const loginRes = await fetchAPI("/auth/login", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      const token = loginRes.token;

      // 2. Hit API Me (Dapatkan Data User Terbaru)
      // Ini memastikan nama & avatar yang tampil di dashboard adalah yang paling update
      const meRes = await fetchAPI("/auth/me", {
         headers: { Authorization: `Bearer ${token}` }
      });

      // Normalisasi data user (handle struktur response: { data: user } atau { user: user })
      const userData = meRes.data || meRes.user || meRes;

      // 3. Simpan Token & Data User Lengkap ke Context
      login(token, userData);

      // 4. Cek Status Couple
      try {
        const statusData = await fetchAPI("/couples/my-status", {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.dismiss(loadingToast);
        // Tampilkan nama dari data /auth/me
        toast.success(`Selamat datang, ${userData.display_name || 'Kak'}!`);
        
        // Delay agar state context tersimpan sempurna sebelum redirect
        setTimeout(() => {
            if (statusData.has_couple) {
                router.replace("/home"); 
            } else {
                router.replace("/onboarding"); 
            }
        }, 500);

      } catch (statusErr) {
        // Fallback jika API status gagal (tetap login tapi arahkan ke home)
        console.error("Gagal cek status couple:", statusErr);
        toast.dismiss(loadingToast);
        toast.success(`Selamat datang, ${userData.display_name || 'Kak'}!`);
        router.replace("/home");
      }

    } catch (err: any) {
      toast.dismiss(loadingToast);

      // UI Error Handling (Delay agar tidak bentrok dengan toast)
      setTimeout(() => {
          if (
            err.error === "Email not confirmed" || 
            err.message === "Email not confirmed" ||
            (err.message && err.message.includes("Email not confirmed"))
          ) {
            Swal.fire({
              title: 'Verifikasi Email Dulu Yuk!',
              html: `
                <div class="text-gray-600">
                  <p class="mb-3">Akunmu sudah ada, tapi belum aktif.</p>
                  <div class="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-700 mb-2">
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
    <div className="min-h-screen flex flex-col justify-center px-8 bg-white max-w-md mx-auto">
      <div className="mb-10 text-center">
        <div className="inline-flex p-3 bg-primary-50 rounded-full mb-4 animate-bounce">
            <Heart className="text-primary-500" size={32} fill="currentColor" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Selamat Datang</h1>
        <p className="text-gray-500">Masuk untuk terhubung dengan pasanganmu</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        
        <Input
            label="Email"
            type="email"
            placeholder="nama@email.com"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
        />

        <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
        />

        <Button type="submit" isLoading={isLoading}>
          Masuk Sekarang
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-500">
        Belum punya akun?{" "}
        <Link href="/register" className="text-primary-600 font-semibold hover:underline">
          Daftar Dulu
        </Link>
      </div>
    </div>
  );
}
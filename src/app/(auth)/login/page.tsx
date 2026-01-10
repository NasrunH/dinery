"use client";

import { useState } from "react";
import { fetchAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Heart, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 1. Hit API Login
      const res = await fetchAPI("/auth/login", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      // Simpan Token & User State
      login(res.token, res.user);

      // 2. LOGIC ROUTING (Cek Status Couple)
      // Kita panggil API status secara manual di sini untuk keputusan routing instan
      const statusRes = await fetch("http://localhost:5000/api/couples/my-status", {
        headers: { "Authorization": `Bearer ${res.token}` }
      });
      const statusData = await statusRes.json();
      
      if (statusData.has_couple) {
        router.replace("/home"); // Sudah punya -> Home
      } else {
        router.replace("/onboarding"); // Jomblo -> Binding
      }

    } catch (err: any) {
      setError(err.message || "Email atau password salah");
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
        {error && <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg text-center border border-red-100">{error}</div>}
        
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
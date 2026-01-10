"use client";

import { useState } from "react";
import { fetchAPI } from "@/lib/api";
import Link from "next/link";
import { Heart, User, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // 1. Register
      await fetchAPI("/auth/register", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      // 2. Redirect ke Login agar user login manual
      alert("Registrasi Berhasil! Silakan login.");
      router.push("/login");

    } catch (err: any) {
      alert(err.message || "Gagal daftar. Coba email lain.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-8 bg-white max-w-md mx-auto">
      <div className="mb-8 text-center fade-in">
        <div className="inline-flex p-4 bg-primary-50 rounded-full mb-4">
          <Heart className="text-primary-500" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Buat Akun Baru</h1>
        <p className="text-gray-500">Mulai perjalanan cintamu di sini</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4 fade-in">
        <Input 
          icon={<User size={20}/>} 
          placeholder="Nama Panggilan" 
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
        <Input 
          icon={<Mail size={20}/>} 
          placeholder="Alamat Email" 
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
        <Input 
          icon={<Lock size={20}/>} 
          placeholder="Password Rahasia" 
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />
        
        <Button type="submit" isLoading={isLoading} className="mt-4">
          Daftar Sekarang
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-500">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-primary-600 font-bold hover:underline">
          Masuk Aja
        </Link>
      </p>
    </div>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import { fetchAPI } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import Swal from "sweetalert2"; // Import SweetAlert2

export default function RegisterPage() {
  const router = useRouter();
  
  // State Form (Hanya Email, Password, dan Confirm Password)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // 1. Validasi Frontend: Password Matching
    if (formData.password !== formData.confirmPassword) {
      toast.error("Password dan Konfirmasi Password tidak sama!");
      setIsLoading(false);
      return;
    }

    // 2. Validasi Frontend: Panjang Password (Opsional, tapi disarankan)
    if (formData.password.length < 6) {
        toast.error("Password minimal 6 karakter");
        setIsLoading(false);
        return;
    }

    const loadingToast = toast.loading("Mendaftarkan akun...");

    try {
      // 3. Hit API Register
      // Payload hanya mengirim email & password (confirmPassword dibuang)
      await fetchAPI("/auth/register", {
        method: "POST",
        body: JSON.stringify({
            email: formData.email,
            password: formData.password
        }),
      });

      toast.dismiss(loadingToast);

      // 4. Tampilkan SweetAlert Success dengan instruksi jelas
      await Swal.fire({
        title: 'Registrasi Berhasil!',
        html: `
          <div class="text-gray-600">
            <p class="mb-2">Akunmu berhasil dibuat.</p>
            <p class="text-sm font-bold text-primary-600">
              Silakan cek kotak masuk (Inbox/Spam) email Anda untuk verifikasi.
            </p>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'Siap, Ke Halaman Login',
        confirmButtonColor: '#ec4899', // Warna Pink/Primary
        allowOutsideClick: false,
        backdrop: `
          rgba(0,0,123,0.4)
          left top
          no-repeat
        `
      });

      // 5. Redirect ke Login setelah user klik OK
      router.push("/login");

    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.message || "Gagal mendaftar. Coba lagi nanti.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-8 bg-white max-w-md mx-auto">
      <div className="mb-8 text-center">
        <div className="inline-flex p-3 bg-primary-50 rounded-full mb-4">
            <Heart className="text-primary-500" size={32} fill="currentColor" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Buat Akun Baru</h1>
        <p className="text-gray-500">Mulai perjalanan kulinermu bersama pasangan</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        
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
            placeholder="Minimal 6 karakter"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
        />

        <Input
            label="Konfirmasi Password"
            type="password"
            placeholder="Ketik ulang password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            required
        />

        <div className="pt-2">
            <Button type="submit" isLoading={isLoading} className="w-full">
            Daftar Sekarang
            </Button>
        </div>
      </form>

      <div className="mt-8 text-center text-sm text-gray-500">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-primary-600 font-semibold hover:underline">
          Masuk di sini
        </Link>
      </div>
    </div>
  );
}
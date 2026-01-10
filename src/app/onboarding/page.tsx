"use client";

import { useState } from "react";
import { fetchAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Copy, HeartHandshake, ArrowRight, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function OnboardingPage() {
  const router = useRouter();
  
  // State UI
  const [view, setView] = useState<"choice" | "create" | "join">("choice");
  const [isLoading, setIsLoading] = useState(false);

  // Form Data
  const [coupleName, setCoupleName] = useState("");
  const [inviteCode, setInviteCode] = useState(""); // Hasil generate
  const [inputCode, setInputCode] = useState("");   // Input user buat join

  // SKENARIO A: Buat Couple Baru
  const createCouple = async () => {
    if(!coupleName) return alert("Isi nama couple dulu dong!");
    
    setIsLoading(true);
    try {
      const res = await fetchAPI("/couples/create", { 
        method: "POST",
        body: JSON.stringify({ name: coupleName })
      });
      // Response: data.invite_code
      setInviteCode(res.data.invite_code);
      setView("create"); // Pindah ke tampilan kode
    } catch (err: any) {
      alert(err.message || "Gagal membuat couple.");
    } finally {
      setIsLoading(false);
    }
  };

  // SKENARIO B: Gabung Couple
  const joinCouple = async () => {
    if(!inputCode) return alert("Masukan kode invite!");

    setIsLoading(true);
    try {
      await fetchAPI("/couples/join", {
        method: "POST",
        body: JSON.stringify({ invite_code: inputCode }),
      });
      alert("Berhasil bergabung! Selamat datang.");
      router.replace("/home");
    } catch (err: any) {
      alert(err.message || "Kode salah atau kadaluarsa.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto flex flex-col p-6 shadow-xl relative overflow-hidden">
      <div className="flex-1 flex flex-col justify-center fade-in z-10">
        
        {/* --- HEADER --- */}
        <div className="mb-10 text-center">
            <HeartHandshake className="text-primary-500 mx-auto mb-4 w-20 h-20" strokeWidth={1.5} />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Satu Langkah Lagi</h1>
            <p className="text-gray-500 text-sm">Hubungkan akunmu dengan pasangan untuk memulai petualangan.</p>
        </div>

        {/* --- VIEW 1: PILIHAN --- */}
        {view === "choice" && (
          <div className="space-y-4">
            {/* Pilihan A */}
            <div className="p-4 border border-primary-100 rounded-2xl bg-primary-50/50 hover:border-primary-300 transition cursor-pointer" onClick={() => setView("create")}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary-100 text-primary-600 rounded-lg"><UserPlus size={20}/></div>
                    <h3 className="font-bold text-gray-800">Buat Couple Baru</h3>
                </div>
                <p className="text-xs text-gray-500">Pilih ini jika kamu yang memulai hubungan di aplikasi ini. Kamu akan dapat kode invite.</p>
            </div>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">ATAU</span>
                <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Pilihan B */}
            <div className="p-4 border border-gray-200 rounded-2xl hover:border-gray-400 transition cursor-pointer" onClick={() => setView("join")}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gray-100 text-gray-600 rounded-lg"><Users size={20}/></div>
                    <h3 className="font-bold text-gray-800">Gabung dengan Kode</h3>
                </div>
                <p className="text-xs text-gray-500">Pilih ini jika pasanganmu sudah membuat couple dan memberimu kode.</p>
            </div>
          </div>
        )}

        {/* --- VIEW 2: INPUT NAMA (CREATOR) --- */}
        {view === "create" && !inviteCode && (
             <div className="space-y-4 animate-in slide-in-from-right">
                <Input 
                    label="Nama Couple Kalian"
                    placeholder="Contoh: Rangga & Cinta"
                    value={coupleName}
                    onChange={(e) => setCoupleName(e.target.value)}
                />
                <Button onClick={createCouple} isLoading={isLoading}>
                    Buat Sekarang <ArrowRight size={18} />
                </Button>
                <Button variant="ghost" onClick={() => setView("choice")}>Batal</Button>
             </div>
        )}

        {/* --- VIEW 3: TAMPILKAN KODE (CREATOR RESULT) --- */}
        {view === "create" && inviteCode && (
          <div className="text-center space-y-6 animate-in zoom-in">
            <div className="bg-primary-50 p-6 rounded-3xl border border-primary-100">
                <p className="text-sm text-gray-500 mb-2">Kode Undangan Kamu</p>
                <div className="text-4xl font-black text-primary-600 tracking-widest font-mono select-all">
                    {inviteCode}
                </div>
            </div>
            <p className="text-sm text-gray-500">
                Bagikan kode ini ke pasanganmu. <br/>
                Halaman ini tidak akan pindah otomatis sampai pasanganmu join.
            </p>
            <Button variant="secondary" onClick={() => {navigator.clipboard.writeText(inviteCode); alert("Disalin!")}}>
                <Copy size={18} /> Salin Kode
            </Button>
            <Button variant="outline" onClick={() => router.replace("/home")}>
               Masuk ke Home Dulu
            </Button>
          </div>
        )}

        {/* --- VIEW 4: INPUT KODE (JOINER) --- */}
        {view === "join" && (
          <div className="space-y-4 animate-in slide-in-from-right">
            <Input 
                label="Masukkan Kode Invite"
                placeholder="X Y Z 1 2 3"
                className="text-center uppercase tracking-widest text-lg font-bold"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            />
            <Button onClick={joinCouple} isLoading={isLoading} disabled={!inputCode}>
              Gabung Sekarang <ArrowRight size={18} />
            </Button>
            <Button variant="ghost" onClick={() => setView("choice")}>
              Kembali
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect, Suspense } from "react";
import { fetchAPI } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, HeartHandshake, ArrowRight, UserPlus, Users, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkCoupleStatus } = useAuth();
  
  // State UI
  const [view, setView] = useState<"choice" | "create" | "join">("choice");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Form Data
  const [coupleName, setCoupleName] = useState("");
  const [inviteCode, setInviteCode] = useState(""); // Hasil generate
  const [inputCode, setInputCode] = useState("");   // Input user buat join

  // Auto-detect invite code dari query URL parameter (?code=XYZ)
  useEffect(() => {
    const codeParam = searchParams.get("code");
    if (codeParam) {
      setInputCode(codeParam.trim().toUpperCase());
      setView("join");
    }
  }, [searchParams]);

  // SKENARIO A: Buat Couple Baru
  const createCouple = async () => {
    if (!coupleName.trim()) {
      toast.error("Isi nama couple kalian dulu dong!");
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetchAPI("/couples/create", { 
        method: "POST",
        body: JSON.stringify({ name: coupleName.trim() })
      });
      const generatedCode = res?.data?.invite_code || "";
      setInviteCode(generatedCode);
      await checkCoupleStatus();
      setView("create");
      toast.success("Couple berhasil dibuat!");
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat couple.");
    } finally {
      setIsLoading(false);
    }
  };

  // SKENARIO B: Gabung Couple
  const joinCouple = async () => {
    if (!inputCode.trim()) {
      toast.error("Masukkan kode invite!");
      return;
    }

    setIsLoading(true);
    try {
      await fetchAPI("/couples/join", {
        method: "POST",
        body: JSON.stringify({ invite_code: inputCode.trim() }),
      });
      await checkCoupleStatus();
      toast.success("Berhasil bergabung! Selamat berpetualang.");
      router.replace("/home");
    } catch (err: any) {
      toast.error(err.message || "Kode salah atau kadaluarsa.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setIsCopied(true);
    toast.success("Kode invite disalin!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const shareInviteLink = async () => {
    if (!inviteCode) return;
    const shareUrl = `${window.location.origin}/onboarding?code=${inviteCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Ayo Gabung di Dinery!",
          text: `Yuk hubungkan akun Dinery kita! Gunakan kode invite: ${inviteCode}`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fallback ke copy jika user membatalkan share sheet
      }
    }
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link undangan disalin ke clipboard!");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 max-w-md mx-auto flex flex-col p-6 shadow-xl relative overflow-hidden transition-colors">
      <div className="flex-1 flex flex-col justify-center fade-in z-10">
        
        {/* --- HEADER --- */}
        <div className="mb-10 text-center">
            <HeartHandshake className="text-primary-500 mx-auto mb-4 w-20 h-20" strokeWidth={1.5} />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Satu Langkah Lagi</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Hubungkan akunmu dengan pasangan untuk memulai petualangan kuliner bersama.</p>
        </div>

        {/* --- VIEW 1: PILIHAN --- */}
        {view === "choice" && (
          <div className="space-y-4">
            {/* Pilihan A: Buat */}
            <div 
              className="p-4 border border-primary-100 dark:border-primary-950/60 rounded-2xl bg-primary-50/50 dark:bg-primary-950/20 hover:border-primary-300 dark:hover:border-primary-800 transition cursor-pointer" 
              onClick={() => setView("create")}
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-lg"><UserPlus size={20}/></div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">Buat Couple Baru</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pilih ini jika kamu yang memulai hubungan di aplikasi ini. Kamu akan dapat kode invite untuk dibagikan.</p>
            </div>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-gray-500 text-xs">ATAU</span>
                <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
            </div>

            {/* Pilihan B: Gabung */}
            <div 
              className="p-4 border border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-900/40 hover:border-gray-400 dark:hover:border-gray-700 transition cursor-pointer" 
              onClick={() => setView("join")}
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg"><Users size={20}/></div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">Gabung dengan Kode</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pilih ini jika pasanganmu sudah membuat couple dan memberimu kode invite.</p>
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
                    autoFocus
                />
                <Button onClick={createCouple} isLoading={isLoading} className="w-full">
                    Buat Sekarang <ArrowRight size={18} />
                </Button>
                <Button variant="ghost" onClick={() => setView("choice")} className="w-full">
                    Batal
                </Button>
             </div>
        )}

        {/* --- VIEW 3: TAMPILKAN KODE (CREATOR RESULT) --- */}
        {view === "create" && inviteCode && (
          <div className="text-center space-y-6 animate-in zoom-in">
            <div className="bg-primary-50 dark:bg-primary-950/40 p-6 rounded-3xl border border-primary-100 dark:border-primary-900/50">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Kode Undangan Kamu</p>
                <div className="text-4xl font-black text-primary-600 dark:text-primary-400 tracking-widest font-mono select-all">
                    {inviteCode}
                </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Bagikan kode ini ke pasanganmu. <br/>
                Pasanganmu bisa langsung memasukkan kode ini saat mendaftar.
            </p>
            
            <div className="flex flex-col gap-2.5">
              <Button variant="secondary" onClick={copyInviteCode} className="w-full flex items-center justify-center gap-2">
                  {isCopied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                  {isCopied ? "Kode Disalin!" : "Salin Kode"}
              </Button>
              <Button variant="outline" onClick={shareInviteLink} className="w-full flex items-center justify-center gap-2">
                  <Share2 size={18} /> Bagikan Link Undangan
              </Button>
              <Button variant="ghost" onClick={() => router.replace("/home")} className="w-full">
                 Masuk ke Home Dulu
              </Button>
            </div>
          </div>
        )}

        {/* --- VIEW 4: INPUT KODE (JOINER) --- */}
        {view === "join" && (
          <div className="space-y-4 animate-in slide-in-from-right">
            <Input 
                label="Masukkan Kode Invite"
                placeholder="X Y Z 1 2"
                className="text-center uppercase tracking-widest text-xl font-bold"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                autoFocus
            />
            <Button onClick={joinCouple} isLoading={isLoading} disabled={!inputCode} className="w-full">
              Gabung Sekarang <ArrowRight size={18} />
            </Button>
            <Button variant="ghost" onClick={() => setView("choice")} className="w-full">
              Kembali
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <HeartHandshake className="text-primary-500 w-12 h-12 animate-pulse" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}

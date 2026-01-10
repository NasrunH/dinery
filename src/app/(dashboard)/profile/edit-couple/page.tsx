"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Heart } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function EditCouplePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coupleName, setCoupleName] = useState("");

  useEffect(() => {
    const fetchCouple = async () => {
        try {
            const res = await fetchAPI("/couples/my-status");
            if (res.data) setCoupleName(res.data.name);
        } catch (e) { console.error(e) }
        finally { setLoading(false); }
    };
    fetchCouple();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
        await fetchAPI("/couples", {
            method: "PUT",
            body: JSON.stringify({ name: coupleName })
        });
        alert("Nama couple berhasil diupdate!");
        router.back();
    } catch (err) {
        alert("Gagal update nama.");
    } finally {
        setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-6 py-4 flex items-center gap-4 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={24} className="text-gray-700"/>
        </button>
        <h1 className="text-lg font-bold text-gray-800">Edit Nama Couple</h1>
      </div>

      <div className="p-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center mb-6">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 text-pink-500">
                <Heart size={32} fill="currentColor" />
            </div>
            <p className="text-gray-500 text-sm">Ubah nama panggilan hubungan kalian agar terasa lebih spesial.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
            <Input 
                label="Nama Couple"
                placeholder="Contoh: Keluarga Cemara"
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
            />
            
            <Button type="submit" isLoading={saving}>
                <Save size={18} className="mr-2"/> Simpan
            </Button>
        </form>
      </div>
    </div>
  );
}
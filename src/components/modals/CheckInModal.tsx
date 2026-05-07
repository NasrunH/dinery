"use client";

import { useState, useRef } from "react";
import { X, Star, Camera, Calendar, Loader2, Repeat } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fetchAPI, API_URL } from "@/lib/api";
import { useRouter } from "next/navigation";

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  placeId: string;
  placeName: string;
}

export default function CheckInModal({ isOpen, onClose, placeId, placeName }: CheckInModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- STATE FORM ---
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]); // Default Today
  const [isRepeat, setIsRepeat] = useState(false);
  
  // --- STATE FILE ---
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  // --- STATE UI ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  if (!isOpen) return null;

  // Handle File Selection & Preview
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);

      // Buat URL preview
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // --- LOGIC SUBMIT (The Hard Part) ---
  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Kasih bintang dulu dong! ⭐");
      return;
    }
    
    setIsSubmitting(true);

    try {
      const uploadedUrls: string[] = [];

      // 1. UPLOAD FILE SATU PER SATU
      // Kita loop karena endpoint biasanya handle single file upload
      if (files.length > 0) {
        setUploadProgress("Mengupload foto...");
        
        for (const file of files) {
          const formData = new FormData();
          formData.append("image", file); // Key harus 'image' sesuai backend

          // Kita pakai fetch biasa (bukan helper fetchAPI) karena butuh FormData
          // dan tidak boleh set Content-Type: application/json
          const token = localStorage.getItem("dinery_token");
          
          const res = await fetch(`${API_URL}/storage/upload`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`
            },
            body: formData
          });

          const data = await res.json();
          if (data.url) {
            uploadedUrls.push(data.url);
          }
        }
      }

      // 2. KIRIM DATA VISIT
      setUploadProgress("Menyimpan kenangan...");
      
      const payload = {
        place_id: placeId,
        rating: rating,
        review_text: review, // Sesuaikan ke review_text
        repeat_order: isRepeat, // Sesuaikan ke repeat_order
        visit_date: visitDate, // Sesuaikan ke visit_date
        photo_urls: uploadedUrls
      };

      await fetchAPI("/visits", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      // 3. SUKSES
      setUploadProgress("Selesai!");
      onClose(); // Tutup modal
      router.push("/history"); // Pindah ke tab History
      router.refresh();

    } catch (error) {
      console.error(error);
      alert("Gagal check-in. Coba lagi ya.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      {/* Modal Card */}
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-transparent dark:border-gray-800">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Gimana makanannya?</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{placeName}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
            <X size={20} className="text-gray-600 dark:text-gray-300"/>
          </button>
        </div>

        {/* 1. Rating Stars */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button 
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110 active:scale-95"
            >
              <Star 
                size={36} 
                fill={star <= rating ? "#f43f5e" : "none"} // primary-500
                className={star <= rating ? "text-primary-500" : "text-gray-300"}
              />
            </button>
          ))}
        </div>

        <div className="space-y-4">
          
          {/* 2. Review Text */}
          <textarea
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none transition"
            rows={3}
            placeholder="Ceritain dong, enak ga? Suasananya gimana?..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
          />

          {/* 3. Date & Repeat */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                    <Calendar size={16} />
                </div>
                <input 
                    type="date" 
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-xl py-3 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                />
            </div>
            
            <label className={`flex-1 flex items-center justify-center gap-2 border rounded-xl cursor-pointer transition-all select-none ${isRepeat ? "bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-500/50 text-primary-600 dark:text-primary-400" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={isRepeat} 
                    onChange={(e) => setIsRepeat(e.target.checked)}
                />
                <Repeat size={16} />
                <span className="text-xs font-bold">Mau Lagi?</span>
            </label>
          </div>

          {/* 4. Photo Upload */}
          <div>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {/* Upload Button */}
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 shrink-0 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 hover:border-primary-400 dark:hover:border-primary-500 hover:text-primary-500 dark:hover:text-primary-400 bg-gray-50 dark:bg-gray-800/50 transition"
                >
                    <Camera size={24} />
                    <span className="text-[10px] mt-1">Tambah</span>
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    multiple 
                    accept="image/*"
                    onChange={handleFileSelect}
                />

                {/* Previews */}
                {previews.map((src, idx) => (
                    <div key={idx} className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden group">
                        <img src={src} className="w-full h-full object-cover" />
                        <button 
                            onClick={() => removeFile(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}
            </div>
          </div>
        </div>

        {/* 5. Submit Button */}
        <div className="mt-8">
            <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="w-full shadow-xl shadow-primary-200/50"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="animate-spin mr-2" size={18} /> 
                        {uploadProgress || "Menyimpan..."}
                    </>
                ) : (
                    "Simpan Kenangan ❤️"
                )}
            </Button>
        </div>

      </div>
    </div>
  );
}
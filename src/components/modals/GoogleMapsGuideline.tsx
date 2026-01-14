"use client";

import { X, MapPin, Copy, Search } from "lucide-react";

interface GoogleMapsGuidelineProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoogleMapsGuideline({ isOpen, onClose }: GoogleMapsGuidelineProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 text-sm">Cara Salin Link Maps</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          
          {/* Langkah 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">1</div>
            <div className="space-y-2 w-full">
              <p className="text-sm text-gray-700 font-medium">Buka aplikasi <span className="font-bold text-gray-900">Google Maps</span> dan cari tempat tujuanmu.</p>
              <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-center border border-gray-200">
                 <div className="flex flex-col items-center text-gray-400">
                    <Search size={24} className="mb-1"/>
                    <span className="text-[10px]">Cari Lokasi</span>
                 </div>
              </div>
            </div>
          </div>

          {/* Langkah 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">2</div>
            <div className="space-y-2 w-full">
              <p className="text-sm text-gray-700 font-medium">Pilih lokasi hingga muncul pin merah, lalu geser menu di bawah.</p>
              <div className="bg-gray-100 rounded-lg h-32 relative border border-gray-200 overflow-hidden">
                 {/* Simulasi Tampilan Maps */}
                 <div className="absolute inset-0 bg-blue-50/50 flex items-center justify-center">
                    <MapPin size={32} className="text-red-500 drop-shadow-md mb-4" fill="currentColor"/>
                 </div>
                 <div className="absolute bottom-0 left-0 right-0 h-10 bg-white border-t border-gray-200 flex items-center px-4">
                    <div className="h-2 w-1/3 bg-gray-200 rounded-full"></div>
                 </div>
              </div>
            </div>
          </div>

          {/* Langkah 3 - UPDATED WITH IMAGE */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">3</div>
            <div className="space-y-2 w-full">
              <p className="text-sm text-gray-700 font-medium">Klik tombol <span className="font-bold text-gray-900">Share / Bagikan</span>.</p>
              
              {/* Gambar Custom User */}
              <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                 <img 
                    src="/images/maps-share.jpeg" 
                    alt="Tombol Share di Google Maps" 
                    className="w-full h-auto object-cover"
                    onError={(e) => {
                        // Fallback jika gambar belum ada
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x150?text=Screenshot+Maps";
                    }}
                 />
              </div>
              <p className="text-[10px] text-gray-400 italic">Pastikan gambar "maps-share.png" ada di folder public/images</p>
            </div>
          </div>

          {/* Langkah 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">4</div>
            <div className="space-y-2 w-full">
              <p className="text-sm text-gray-700 font-medium">Pilih <span className="font-bold text-gray-900">Copy Link / Salin</span> lalu tempel di sini.</p>
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-3 flex items-center justify-between">
                 <span className="text-xs text-gray-400 truncate w-32">https://maps.app.goo...</span>
                 <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                    <Copy size={12}/> Disalin!
                 </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition active:scale-95">
            Paham, Mari Kita Coba
          </button>
        </div>

      </div>
    </div>
  );
}
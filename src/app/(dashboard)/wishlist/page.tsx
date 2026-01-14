"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import Link from "next/link";
import { 
  MapPin, Plus, Search, Dice5, 
  Map as MapIcon, X, PlayCircle, Info, RefreshCw,
  Settings2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/Skeleton";
import { Place, Category } from "@/types";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

type PartnerData = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  email: string;
};

export default function WishlistPage() {
  const { user } = useAuth();
  
  // --- STATE ---
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [userLocation, setUserLocation] = useState<{ lat: number; long: number } | null>(null);
  
  // State Radius (Satuan KM)
  // Default 5 KM
  const [searchRadius, setSearchRadius] = useState(5); 
  const [showRadiusSetting, setShowRadiusSetting] = useState(false);

  // State untuk Partner
  const [partner, setPartner] = useState<PartnerData | null>(null);
  
  // Gacha State
  const [isGachaOpen, setIsGachaOpen] = useState(false);
  const [gachaResult, setGachaResult] = useState<Place | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // --- HELPER: MAPPER DATA ---
  const mapPlaceData = (rawItems: any[]): Place[] => {
    return rawItems.map((item: any) => {
        let catName = "Umum";
        if (item.m_categories?.name) {
            catName = item.m_categories.name;
        } else if (item.category_id && categories.length > 0) {
            const foundCat = categories.find(c => c.id === item.category_id);
            if (foundCat) catName = foundCat.name;
        }

        return {
            id: item.id.toString(),
            name: item.name,
            image_url: item.meta_image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
            original_link: item.original_link,
            platform: item.platform,
            category: catName,
            price_level: item.m_price_ranges?.label || (item.price_range_id === 1 ? "$" : item.price_range_id === 3 ? "$$$" : "$$"),
            tags: item.tags || (item.place_tags || []).map((t: any) => t.m_tags) || [],
            gmaps_link: item.maps_link,
            distance: item.dist_meters ? `${(item.dist_meters / 1000).toFixed(1)} km` : undefined
        };
    });
  };

  // --- INIT DATA ---
  useEffect(() => {
    const initData = async () => {
      try {
        const catRes = await fetchAPI("/master/categories");
        setCategories(catRes.data || []);

        const placesRes = await fetchAPI("/places?status=wishlist");
        const mappedPlaces = (placesRes.data || []).map((item: any) => ({
            id: item.id.toString(),
            name: item.name,
            image_url: item.meta_image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
            original_link: item.original_link,
            platform: item.platform,
            category: item.m_categories?.name || "Umum",
            price_level: item.m_price_ranges?.label || "$",
            tags: item.tags || (item.place_tags || []).map((t: any) => t.m_tags) || [],
            gmaps_link: item.maps_link,
            distance: undefined
        }));

        setPlaces(mappedPlaces);
        setFilteredPlaces(mappedPlaces);

        const coupleRes = await fetchAPI("/couples/my-status");
        if (coupleRes.has_couple && coupleRes.partner_data) {
            setPartner(coupleRes.partner_data);
        }

      } catch (err) {
        console.error("Gagal load data", err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // --- FILTERING ---
  useEffect(() => {
    let result = places;
    if (searchQuery) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCategory !== "Semua") {
      result = result.filter(p => p.category === selectedCategory);
    }
    setFilteredPlaces(result);
  }, [searchQuery, selectedCategory, places]);

  // --- HANDLE NEARBY ---
  const handleNearby = () => {
    if (!navigator.geolocation) {
      toast.error("Browser tidak mendukung GPS");
      return;
    }

    // Tampilkan loading toast
    const loadingToast = toast.loading("Mencari lokasi...");
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, long: longitude });

            try {
                // UPDATE: Kirim radius langsung dalam KM
                const res = await fetchAPI(`/places/nearby?lat=${latitude}&long=${longitude}&radius=${searchRadius}`);
                const nearbyPlaces = mapPlaceData(res.data || []);

                setPlaces(nearbyPlaces);
                setFilteredPlaces(nearbyPlaces);
                setSelectedCategory("Semua");
                
                toast.dismiss(loadingToast); // Tutup loading

                if (nearbyPlaces.length === 0) {
                   Swal.fire({
                     icon: 'info',
                     title: 'Sepi Banget!',
                     text: `Tidak ada tempat wishlist dalam radius ${searchRadius} km. Coba tambah radiusnya?`,
                     confirmButtonColor: '#3b82f6'
                   });
                } else {
                   toast.success(`Ketemu ${nearbyPlaces.length} tempat di sekitarmu (${searchRadius} km)!`);
                }

            } catch (err) {
                toast.dismiss(loadingToast);
                console.error(err);
                toast.error("Gagal mencari tempat terdekat.");
            } finally {
                setLoading(false);
            }
        },
        (err) => {
            toast.dismiss(loadingToast);
            setLoading(false);
            console.error(err);
            toast.error("Gagal mendapatkan lokasi. Pastikan GPS aktif.");
        }
    );
  };

  // --- RELOAD ---
  const handleReset = async () => {
    setLoading(true);
    setUserLocation(null);
    const loadingToast = toast.loading("Memuat ulang...");
    
    try {
        const res = await fetchAPI("/places?status=wishlist");
        const mapped = (res.data || []).map((item: any) => ({
            id: item.id.toString(),
            name: item.name,
            image_url: item.meta_image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
            category: item.m_categories?.name || "Umum",
            price_level: item.m_price_ranges?.label || "$",
            original_link: item.original_link,
            platform: item.platform,
            gmaps_link: item.maps_link,
            tags: item.tags || (item.place_tags || []).map((t: any) => t.m_tags) || [],
        }));
        setPlaces(mapped);
        setFilteredPlaces(mapped);
        toast.dismiss(loadingToast);
        toast.success("List berhasil direset!");
    } catch(e) { 
        toast.dismiss(loadingToast);
        toast.error("Gagal refresh data"); 
    } finally {
        setLoading(false);
    }
  };

  // --- GACHA ---
  const handleGacha = async () => {
    if (places.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Wishlist Kosong',
        text: 'Tambah tempat dulu yuk sebelum main Gacha!',
        confirmButtonColor: '#ec4899'
      });
      return;
    }
    setIsGachaOpen(true);
    setIsSpinning(true);
    setGachaResult(null);

    const shuffleInterval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * places.length);
      setGachaResult(places[randomIdx]);
    }, 100);

    try {
      const res = await fetchAPI("/places/gacha");
      const item = res.winner_data;
      if(!item) throw new Error("Kosong");

      const finalResult: Place = {
          id: item.id.toString(),
          name: item.name,
          image_url: item.meta_image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
          original_link: item.original_link,
          platform: item.platform,
          category: item.m_categories?.name || "Umum",
          price_level: item.m_price_ranges?.label || "$",
          tags: [],
          gmaps_link: item.maps_link
      };

      setTimeout(() => {
        clearInterval(shuffleInterval);
        setIsSpinning(false);
        setGachaResult(finalResult);
      }, 2000);
    } catch (err: any) {
      clearInterval(shuffleInterval);
      setIsSpinning(false);
      setIsGachaOpen(false);
      toast.error("Gagal melakukan gacha. Coba lagi.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 relative">
      
      {/* --- HEADER --- */}
      <div className="bg-white sticky top-0 z-20 shadow-sm border-b border-gray-100">
        <div className="px-6 pt-6 pb-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center -space-x-3">
               <div className="w-10 h-10 rounded-full border-2 border-white bg-primary-100 flex items-center justify-center overflow-hidden">
                  {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="Me" className="w-full h-full object-cover" />
                  ) : (
                      <span className="text-primary-600 font-bold">{user?.display_name?.charAt(0) || "U"}</span>
                  )}
               </div>
               
               <div className="w-10 h-10 rounded-full border-2 border-white bg-orange-100 flex items-center justify-center overflow-hidden text-gray-500 text-xs">
                  {partner ? (
                      partner.avatar_url ? (
                        <img src={partner.avatar_url} alt={partner.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-orange-600 font-bold uppercase">{partner.display_name?.charAt(0)}</span>
                      )
                  ) : (
                    <span>Psgn</span>
                  )}
               </div>

               <div className="pl-4">
                  <h1 className="font-bold text-gray-800 text-lg">Wishlist Kita</h1>
                  <p className="text-[10px] text-gray-400">{places.length} tempat tersimpan</p>
               </div>
            </div>
            <Link href="/wishlist/add">
              <button className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-600 active:scale-95 transition">
                <Plus size={24} />
              </button>
            </Link>
          </div>

          <div className="relative flex gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                type="text" 
                placeholder="Cari tempat..." 
                className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 transition"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
             <button 
                onClick={() => setShowRadiusSetting(!showRadiusSetting)}
                className={`p-3 rounded-xl border transition ${showRadiusSetting ? 'bg-primary-50 border-primary-200 text-primary-600' : 'bg-gray-50 border-gray-100 text-gray-500'}`}
             >
                <Settings2 size={20} />
             </button>
          </div>

          {/* RADIUS SETTINGS (KM) */}
          {showRadiusSetting && (
             <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100 animate-in slide-in-from-top-2">
                 <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-600">Jarak Maksimal</label>
                    <span className="text-xs font-bold text-primary-600">{searchRadius} km</span>
                 </div>
                 <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    step="1" 
                    value={searchRadius} 
                    onChange={(e) => setSearchRadius(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                 />
                 <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>1 km</span>
                    <span>10 km</span>
                    <span>20 km</span>
                 </div>
             </div>
          )}
        </div>

        <div className="pb-4 px-6 flex gap-2 overflow-x-auto no-scrollbar">
             <button onClick={() => setSelectedCategory("Semua")} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold border ${selectedCategory === "Semua" ? "bg-gray-800 text-white" : "bg-white text-gray-500"}`}>Semua</button>
             {categories.map(cat => (
               <button key={cat.id} onClick={() => setSelectedCategory(cat.name)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold border ${selectedCategory === cat.name ? "bg-primary-500 text-white" : "bg-white text-gray-500"}`}>{cat.name}</button>
             ))}
        </div>
        
        {/* Magic Buttons */}
        <div className="grid grid-cols-2 gap-3 px-6 pb-4">
             <button onClick={handleGacha} className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-md active:scale-95 transition">
                <Dice5 size={16} /> Gacha
             </button>
             
             {userLocation ? (
                <button onClick={handleReset} className="flex items-center justify-center gap-2 bg-gray-100 text-gray-600 border border-gray-200 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-200 active:scale-95 transition">
                    <RefreshCw size={16} /> Reset List
                </button>
             ) : (
                <button onClick={handleNearby} className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 active:scale-95 transition">
                    <MapIcon size={16} /> Cari Terdekat
                </button>
             )}
        </div>
      </div>

      {/* --- LIST CONTENT --- */}
      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
             {[1,2,3,4].map(i => <div key={i}><Skeleton className="aspect-square w-full rounded-2xl mb-2"/><Skeleton className="h-4 w-3/4 rounded-md"/></div>)}
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
             <MapPin size={32} className="mx-auto mb-2 opacity-50"/>
             <p>Belum ada data.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
             {filteredPlaces.map((place) => (
                <div key={place.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition">
                   
                   <Link href={`/wishlist/${place.id}`} className="block relative aspect-[4/3] bg-gray-100 rounded-xl mb-3 overflow-hidden cursor-pointer group">
                      <img 
                        src={place.image_url} 
                        alt={place.name} 
                        className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                        onError={(e) => {
                             (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";
                        }}
                      />
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-gray-800 shadow-sm">
                         {place.price_level}
                      </div>
                      {place.platform && (
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur text-white px-1.5 py-0.5 rounded text-[8px] font-bold">
                           {place.platform}
                        </div>
                      )}
                   </Link>

                   <div className="flex-1 mb-3">
                      <Link href={`/wishlist/${place.id}`}>
                        <h3 className="font-bold text-gray-800 text-sm leading-snug line-clamp-2 mb-1">{place.name}</h3>
                      </Link>
                      
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] text-gray-400">{place.category}</p>
                        {place.distance && (
                            <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <MapPin size={8}/> {place.distance}
                            </span>
                        )}
                      </div>
                   </div>

                   <div className="flex gap-2 mt-auto pt-2 border-t border-gray-50">
                      {place.gmaps_link && (
                          <a href={place.gmaps_link} target="_blank" className="flex-1 py-1.5 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-100 transition" title="Buka Maps">
                             <MapPin size={14} />
                          </a>
                      )}
                      {place.original_link && (
                          <a href={place.original_link} target="_blank" className="flex-1 py-1.5 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-200 transition" title="Lihat Video">
                             <PlayCircle size={14} />
                          </a>
                      )}
                      <Link href={`/wishlist/${place.id}`} className="flex-1 py-1.5 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center hover:bg-primary-100 transition" title="Detail">
                         <Info size={14} />
                      </Link>
                   </div>
                </div>
             ))}
          </div>
        )}
      </div>

      {/* Gacha Modal */}
      {isGachaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl relative text-center">
              <button onClick={() => setIsGachaOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"><X size={24} /></button>
              
              <div className={`w-20 h-20 mx-auto bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white mb-4 shadow-lg ${isSpinning ? "animate-spin" : ""}`}>
                  <Dice5 size={40} />
              </div>
              
              <h2 className="text-lg font-bold text-gray-800 mb-4">{isSpinning ? "Mengocok Pilihan..." : "Pemenangnya Adalah!"}</h2>
              
              {gachaResult && (
                 <div className="transition-all duration-500 transform scale-100">
                    <div className="w-full h-32 rounded-xl overflow-hidden mb-4 bg-gray-100 border border-gray-200 shadow-inner">
                        <img 
                            src={gachaResult.image_url} 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";
                            }}
                        />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{gachaResult.name}</h3>
                    <p className="text-xs text-gray-500 mb-6">{gachaResult.category} • {gachaResult.price_level}</p>
                    
                    <div className="flex flex-col gap-3">
                        <Link href={`/wishlist/${gachaResult.id}`} className="w-full">
                            <Button className="w-full shadow-lg shadow-primary-200">Lihat Detail</Button>
                        </Link>
                        <div className="flex gap-2">
                            {gachaResult.gmaps_link && (
                                <a href={gachaResult.gmaps_link} target="_blank" className="flex-1 py-3 bg-blue-50 text-blue-600 font-bold rounded-xl text-sm hover:bg-blue-100 transition flex items-center justify-center gap-1">
                                    <MapPin size={16}/> Maps
                                </a>
                            )}
                             {!isSpinning && (
                                <button onClick={handleGacha} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-200 transition">Ulang</button>
                             )}
                        </div>
                    </div>
                 </div>
              )}
           </div>
        </div>
      )}

    </div>
  );
}
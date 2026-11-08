"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { fetchAPI } from "@/lib/api";
import Link from "next/link";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { 
  MapPin, Search, Dice5, 
  X, Bookmark, Building2,
  SlidersHorizontal, RotateCcw, Utensils,
  Navigation, ArrowRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/Skeleton";
import { Place, Category, Tag } from "@/types";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import CategoryIcon from "@/components/ui/CategoryIcon";
import { getContrastTextColor } from "@/lib/tagColor";
import { placeCache } from "@/lib/placeCache";
import FloatingAddButton from "@/components/FloatingAddButton";
import { extractCityFromAddress, formatDistanceKm } from "@/lib/cityExtractor";
import { parsePostGISPoint } from "@/lib/wkbParser";
import WishlistFilterDrawer, { 
  WishlistFilterState, 
  SortOption 
} from "@/components/modals/WishlistFilterDrawer";

type PartnerData = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  email: string;
};

const DEFAULT_FILTERS: WishlistFilterState = {
  cities: [],
  categories: [],
  tags: [],
  priceLevels: [],
  maxDistanceKm: null,
  sortBy: "newest",
};

function WishlistContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  // --- STATE DATA ---
  const [places, setPlaces] = useState<Place[]>([]);
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; long: number } | null>(null);

  // --- STATE SEARCH & FILTER ---
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filters, setFilters] = useState<WishlistFilterState>(DEFAULT_FILTERS);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Debounce search input agar ketikan keyboard halus
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // --- SWR HOOKS ---
  const { data: catRes } = useSWR("/master/categories", fetchAPI);
  const { data: tagRes } = useSWR("/master/tags", fetchAPI);
  const { data: coupleRes, isLoading: loadingCouple } = useSWR("/couples/my-status", fetchAPI);
  const { data: placesRes, isLoading: loadingPlaces } = useSWR("/places?status=wishlist", fetchAPI);
  
  const categories: Category[] = catRes?.data || [];
  const masterTags: Tag[] = tagRes?.data || [];
  const loading = loadingCouple || loadingPlaces;
  
  // --- GACHA STATE ---
  const [isGachaOpen, setIsGachaOpen] = useState(false);
  const [gachaResult, setGachaResult] = useState<Place | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [gachaRadius, setGachaRadius] = useState<number | "all">("all");

  // --- MAPPER DATA ---
  const mapPlaceData = (rawItems: any[], cats: Category[] = categories, loc = userLocation): Place[] => {
    return rawItems.map((item: any) => {
      let catName = "Umum";
      if (item.m_categories?.name) {
        catName = item.m_categories.name;
      } else if (item.category_id && cats.length > 0) {
        const foundCat = cats.find((c) => c.id === item.category_id);
        if (foundCat) catName = foundCat.name;
      }

      // 1. Ekstrak Nama Kota Murni (tanpa "Kabupaten" / "Kota")
      const cityTag = extractCityFromAddress(item.address_text) || undefined;

      // 2. Hitung Jarak dari Lokasi User (GPS)
      let distStr: string | undefined = undefined;
      if (item.dist_meters) {
        distStr = `${(item.dist_meters / 1000).toFixed(1)} km`;
      } else if (item.distance_km !== null && item.distance_km !== undefined) {
        distStr = `${item.distance_km} km`;
      } else if (loc && item.location) {
        const coords = parsePostGISPoint(item.location);
        if (coords) {
          const calculated = formatDistanceKm(loc.lat, loc.long, coords.lat, coords.lng);
          if (calculated) distStr = calculated;
        }
      }

      return {
        id: item.id.toString(),
        name: item.name,
        image_url: item.meta_image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
        original_link: item.original_link,
        platform: item.platform,
        category: catName,
        price_level: item.m_price_ranges?.label || (item.price_range_id === 1 ? "$" : item.price_range_id === 3 ? "$$$" : "$$"),
        tags: item.tags || (item.place_tags || []).map((t: any) => t.m_tags).filter(Boolean) || [],
        gmaps_link: item.maps_link,
        address_text: item.address_text,
        location: item.location,
        city: cityTag,
        distance: distStr,
        target_menu: item.target_menu || undefined,
        created_at: item.created_at || undefined,
      };
    });
  };

  // Deteksi GPS di latar belakang untuk menghitung jarak secara otomatis
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation && !userLocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            long: pos.coords.longitude,
          });
        },
        () => {},
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      );
    }
  }, []);

  // Update jarak tempat secara reaktif begitu GPS terdeteksi
  useEffect(() => {
    if (userLocation && places.length > 0) {
      setPlaces((prev) =>
        prev.map((place) => {
          if (place.location && !place.distance) {
            const coords = parsePostGISPoint(place.location);
            if (coords) {
              const d = formatDistanceKm(userLocation.lat, userLocation.long, coords.lat, coords.lng);
              if (d) return { ...place, distance: d };
            }
          }
          return place;
        })
      );
    }
  }, [userLocation]);

  // Inisialisasi Data dari SWR
  useEffect(() => {
    if (placesRes?.data) {
      const mappedPlaces = mapPlaceData(placesRes.data, categories);
      setPlaces(mappedPlaces);
      // Simpan ke cache agar buka detail (/wishlist/[id]) instan 0 ms
      placeCache.setMany(mappedPlaces);
    }
    if (coupleRes?.has_couple && coupleRes?.partner_data) {
      setPartner(coupleRes.partner_data);
    }
  }, [placesRes?.data, coupleRes, catRes?.data]);

  // Request GPS aktif manual jika user menekan tombol GPS
  const requestGps = () => {
    if (!navigator.geolocation) {
      toast.error("Browser tidak mendukung GPS");
      return;
    }
    const toastId = toast.loading("Mendeteksi lokasi GPS...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          long: pos.coords.longitude,
        });
        toast.dismiss(toastId);
        toast.success("Lokasi GPS berhasil diperbarui!");
      },
      (err) => {
        toast.dismiss(toastId);
        toast.error("Gagal mendapatkan GPS. Pastikan izin lokasi aktif.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // --- DAFTAR KOTA TERSEDIA SECARA DINAMIS ---
  const availableCities = useMemo(() => {
    const cityCountMap: Record<string, number> = {};
    places.forEach((p) => {
      if (p.city) {
        cityCountMap[p.city] = (cityCountMap[p.city] || 0) + 1;
      }
    });
    return Object.entries(cityCountMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [places]);

  // --- FILTERING & SORTING ENGINE (Anti-Thrashing useMemo) ---
  const filteredPlaces = useMemo(() => {
    let result = [...places];

    // 1. Text Search (nama tempat, menu target, alamat, kota)
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase().trim();
      result = result.filter((p) => {
        return (
          p.name.toLowerCase().includes(q) ||
          (p.city && p.city.toLowerCase().includes(q)) ||
          (p.target_menu && p.target_menu.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.address_text && p.address_text.toLowerCase().includes(q)) ||
          p.tags?.some((t) => t.name.toLowerCase().includes(q))
        );
      });
    }

    // 2. Filter Kota / Kabupaten
    if (filters.cities.length > 0) {
      result = result.filter((p) => p.city && filters.cities.includes(p.city));
    }

    // 3. Filter Kategori
    if (filters.categories.length > 0) {
      result = result.filter((p) => filters.categories.includes(p.category));
    }

    // 4. Filter Range Harga
    if (filters.priceLevels.length > 0) {
      result = result.filter((p) => filters.priceLevels.includes(p.price_level));
    }

    // 5. Filter Tags
    if (filters.tags.length > 0) {
      result = result.filter((p) =>
        p.tags?.some((t) => filters.tags.includes(t.id))
      );
    }

    // 6. Filter Radius Jarak (km)
    if (filters.maxDistanceKm !== null) {
      result = result.filter((p) => {
        if (!p.distance) return false;
        const match = p.distance.match(/([\d.]+)/);
        if (!match) return false;
        const km = parseFloat(match[1]);
        return km <= filters.maxDistanceKm!;
      });
    }

    // 7. Sorting
    const getPriceScore = (lvl?: string) => (lvl === "$$$" ? 3 : lvl === "$$" ? 2 : 1);
    const getKm = (p: Place): number => {
      if (!p.distance) return Infinity;
      const match = p.distance.match(/([\d.]+)/);
      return match ? parseFloat(match[1]) : Infinity;
    };

    result.sort((a, b) => {
      switch (filters.sortBy) {
        case "nearest":
          return getKm(a) - getKm(b);
        case "name_asc":
          return a.name.localeCompare(b.name, "id");
        case "price_asc":
          return getPriceScore(a.price_level) - getPriceScore(b.price_level);
        case "price_desc":
          return getPriceScore(b.price_level) - getPriceScore(a.price_level);
        case "newest":
        default:
          return (Number(b.id) || 0) - (Number(a.id) || 0);
      }
    });

    return result;
  }, [places, debouncedQuery, filters]);

  // Jumlah filter aktif untuk badge
  const activeFilterCount = useMemo(() => {
    return (
      filters.cities.length +
      filters.categories.length +
      filters.tags.length +
      filters.priceLevels.length +
      (filters.maxDistanceKm ? 1 : 0) +
      (filters.sortBy !== "newest" ? 1 : 0)
    );
  }, [filters]);

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery("");
  };

  // --- GACHA AUTOPLAY DARI URL PARAM ---
  useEffect(() => {
    if (!loading && places.length > 0 && searchParams.get("action") === "gacha") {
      const url = new URL(window.location.href);
      url.searchParams.delete("action");
      window.history.replaceState({}, "", url.toString());
      handleGacha();
    }
  }, [loading, places, searchParams]);

  // --- HANDLE GACHA ---
  const handleGacha = async (radiusOverride?: number | "all") => {
    const pool = filteredPlaces.length > 0 ? filteredPlaces : places;
    if (pool.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Wishlist Kosong",
        text: "Tambah tempat dulu yuk sebelum main Gacha!",
        confirmButtonColor: "#ec4899",
      });
      return;
    }

    const targetRadius = radiusOverride !== undefined ? radiusOverride : gachaRadius;
    if (radiusOverride !== undefined) {
      setGachaRadius(radiusOverride);
    }

    setIsGachaOpen(true);
    setIsSpinning(true);
    setGachaResult(null);

    const shuffleInterval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * pool.length);
      setGachaResult(pool[randomIdx]);
    }, 150);

    try {
      let coords = userLocation;
      if (targetRadius !== "all" && !coords) {
        if (navigator.geolocation) {
          try {
            coords = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, long: pos.coords.longitude }),
                (err) => reject(err),
                { enableHighAccuracy: true, timeout: 8000 }
              );
            });
            setUserLocation(coords);
          } catch (e) {
            console.warn("GPS timeout:", e);
          }
        }
      }

      if (targetRadius !== "all" && !coords) {
        clearInterval(shuffleInterval);
        setIsSpinning(false);
        toast.error("Aktifkan izin lokasi (GPS) untuk filter radius jarak.");
        return;
      }

      const params = new URLSearchParams();
      if (targetRadius !== "all" && coords) {
        params.append("lat", coords.lat.toString());
        params.append("long", coords.long.toString());
        params.append("radius", targetRadius.toString());
      }
      if (filters.categories.length === 1) {
        const cat = categories.find((c) => c.name === filters.categories[0]);
        if (cat) params.append("category_id", cat.id.toString());
      }

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const res = await fetchAPI(`/places/gacha${queryString}`);
      const item = res.winner_data;
      if (!item) throw new Error("Kosong");

      const finalResult: Place = {
        id: item.id.toString(),
        name: item.name,
        image_url: item.meta_image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
        original_link: item.original_link,
        platform: item.platform,
        category: item.m_categories?.name || "Umum",
        price_level: item.m_price_ranges?.label || "$",
        tags: (item.place_tags || []).map((t: any) => t.m_tags).filter(Boolean) || [],
        gmaps_link: item.maps_link,
        address_text: item.address_text,
        location: item.location,
        city: extractCityFromAddress(item.address_text) || undefined,
        target_menu: item.target_menu || undefined,
        distance:
          item.distance_km !== null && item.distance_km !== undefined
            ? `${item.distance_km} km`
            : item.dist_meters
            ? `${(item.dist_meters / 1000).toFixed(1)} km`
            : undefined,
      };

      setTimeout(() => {
        clearInterval(shuffleInterval);
        setIsSpinning(false);
        setGachaResult(finalResult);
      }, 1400);
    } catch (err: any) {
      clearInterval(shuffleInterval);
      setIsSpinning(false);
      // Fallback lokal jika endpoint gacha tidak menemukan radius
      const randomIdx = Math.floor(Math.random() * pool.length);
      setGachaResult(pool[randomIdx]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/60 dark:bg-gray-950 pb-36 relative transition-colors">
      
      {/* --- HEADER STICKY MODERN --- */}
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md sticky top-0 z-20 shadow-xs border-b border-gray-100 dark:border-gray-800 transition-colors">
        <div className="px-5 pt-5 pb-3">
          
          {/* Top Row: User Avatar & Wishlist Title (NO TOP PLUS BUTTON!) */}
          <div className="flex justify-between items-center mb-3.5">
            <div className="flex items-center gap-3">
              <div className="flex items-center -space-x-2.5">
                <div className="w-9 h-9 rounded-full ring-2 ring-white dark:ring-gray-900 bg-primary-100 dark:bg-primary-950/80 flex items-center justify-center overflow-hidden shadow-xs">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Me" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary-600 dark:text-primary-400 font-bold text-xs">{user?.display_name?.charAt(0) || "U"}</span>
                  )}
                </div>
                
                <div className="w-9 h-9 rounded-full ring-2 ring-white dark:ring-gray-900 bg-orange-100 dark:bg-orange-950/80 flex items-center justify-center overflow-hidden shadow-xs">
                  {partner ? (
                    partner.avatar_url ? (
                      <img src={partner.avatar_url} alt={partner.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-orange-600 dark:text-orange-400 font-bold text-xs uppercase">{partner.display_name?.charAt(0)}</span>
                    )
                  ) : (
                    <span className="text-[10px] text-gray-500 font-semibold">Psgn</span>
                  )}
                </div>
              </div>

              <div>
                <h1 className="font-extrabold text-gray-900 dark:text-gray-100 text-lg tracking-tight">Wishlist Kita</h1>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                  {places.length} tempat tersimpan
                </p>
              </div>
            </div>

            {/* Tombol Gacha Interaktif Cepat di Header */}
            <button
              onClick={() => handleGacha()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition"
              title="Kocok Pilihan Tempat"
            >
              <Dice5 size={14} className="shrink-0 animate-pulse" />
              <span>Gacha</span>
            </button>
          </div>

          {/* Search Bar + Filter Drawer Button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={17} />
              <input 
                type="text" 
                placeholder="Cari tempat, menu, atau kota..." 
                className="w-full bg-gray-100/80 dark:bg-gray-800/80 border border-transparent dark:border-gray-700/60 text-gray-900 dark:text-gray-100 rounded-2xl py-2.5 pl-10 pr-9 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:bg-white dark:focus:bg-gray-800 transition"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Drawer Trigger Button */}
            <button 
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              className={`px-3.5 py-2.5 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-bold relative ${
                activeFilterCount > 0
                  ? "bg-primary-500 text-white border-primary-500 shadow-sm shadow-primary-500/30"
                  : "bg-gray-100/80 dark:bg-gray-800/80 border-transparent dark:border-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200/70"
              }`}
              aria-label="Filter"
            >
              <SlidersHorizontal size={15} />
              <span className="hidden xs:inline">Filter</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-primary-600 dark:text-primary-600 text-[10px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Horizontal Quick Filter Pills (Top Cities + All) */}
        <div className="pb-3 px-5 flex gap-1.5 overflow-x-auto no-scrollbar items-center">
          <button 
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, cities: [] }))} 
            className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold border transition ${
              filters.cities.length === 0
                ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100" 
                : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300"
            }`}
          >
            Semua Kota
          </button>

          {availableCities.slice(0, 6).map((c) => {
            const isSelected = filters.cities.includes(c.name);
            return (
              <button 
                key={c.name} 
                type="button"
                onClick={() => {
                  setFilters((prev) => {
                    const next = isSelected 
                      ? prev.cities.filter((x) => x !== c.name) 
                      : [...prev.cities, c.name];
                    return { ...prev, cities: next };
                  });
                }} 
                className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 transition ${
                  isSelected 
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs" 
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300"
                }`}
              >
                <span>{c.name}</span>
                <span className={`text-[10px] px-1 rounded-full ${isSelected ? "bg-white/20 text-white" : "text-gray-400"}`}>
                  {c.count}
                </span>
              </button>
            );
          })}

          {/* Quick Clear if any filter active */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="whitespace-nowrap px-2.5 py-1 text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 hover:underline ml-1"
            >
              <RotateCcw size={11} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* --- LIST CONTENT / CARDS --- */}
      <div className="p-5">
        {loading ? (
          <div className="grid grid-cols-2 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-3 border border-gray-100 dark:border-gray-800">
                <Skeleton className="aspect-[4/3] w-full rounded-xl mb-2.5"/>
                <Skeleton className="h-4 w-3/4 rounded-md mb-1.5"/>
                <Skeleton className="h-3 w-1/2 rounded-md mb-2"/>
                <Skeleton className="h-6 w-full rounded-lg"/>
              </div>
            ))}
          </div>
        ) : places.length === 0 ? (
          /* Empty State Total: Saat belum ada wishlist sama sekali */
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 mx-auto mb-3.5 bg-primary-50 dark:bg-primary-950/40 rounded-full flex items-center justify-center text-primary-500 shadow-inner">
              <Bookmark size={28} />
            </div>
            <h3 className="font-extrabold text-gray-900 dark:text-gray-100 text-base mb-1">
              Wishlist Masih Kosong
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 max-w-xs mx-auto leading-relaxed">
              Mulai simpan tempat makan impian yang ingin kamu datangi bersama pasangan!
            </p>
            <Link href="/wishlist/add">
              <Button className="shadow-lg shadow-primary-500/25 px-5 py-2.5 text-xs font-bold inline-flex items-center gap-1.5">
                Tambah Tempat Pertama
              </Button>
            </Link>
          </div>
        ) : filteredPlaces.length === 0 ? (
          /* Empty State Filter: Saat hasil filter / search kosong */
          <div className="text-center py-16 px-4 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs">
            <Search size={36} className="mx-auto mb-3 text-gray-300 dark:text-gray-600"/>
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1">
              Tidak Ada Tempat yang Cocok
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 max-w-xs mx-auto">
              Tidak ditemukan tempat dengan kombinasi pencarian atau filter saat ini.
            </p>
            <button 
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 rounded-xl text-xs font-bold hover:bg-primary-100 transition"
            >
              <RotateCcw size={13} />
              <span>Reset Semua Filter</span>
            </button>
          </div>
        ) : (
          /* GRID 2-KOLOM PLACE CARDS MODERN */
          <div className="grid grid-cols-2 gap-3.5">
            {filteredPlaces.map((place) => (
              <div 
                key={place.id} 
                className="bg-white dark:bg-gray-900 rounded-2xl p-2.5 shadow-xs hover:shadow-md border border-gray-100 dark:border-gray-800/90 flex flex-col h-full transition-all duration-200 group"
              >
                {/* 1. Gambar Tempat (Clean 4:3) */}
                <Link 
                  href={`/wishlist/${place.id}`} 
                  onClick={() => placeCache.set(place.id, place)}
                  prefetch={true}
                  className="block relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 rounded-xl mb-2.5 overflow-hidden cursor-pointer"
                >
                  <ImageWithFallback 
                    src={place.image_url} 
                    alt={place.name} 
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Floating Price Level Top-Right */}
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[10px] font-black text-amber-300 shadow-xs tracking-wider">
                    {place.price_level}
                  </div>

                  {/* Floating Platform Top-Left */}
                  {place.platform && (
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white/95 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-tight">
                      {place.platform === "maps" ? "Maps" : place.platform}
                    </div>
                  )}

                  {/* Floating Target Menu Banner on Bottom of Photo if available */}
                  {place.target_menu && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-1.5 pt-3">
                      <p className="text-[9px] font-bold text-white truncate flex items-center gap-1">
                        <Utensils size={10} className="text-amber-400 shrink-0" />
                        <span className="truncate">{place.target_menu}</span>
                      </p>
                    </div>
                  )}
                </Link>

                {/* 2. Informasi Tempat */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    {/* Judul Tempat */}
                    <Link 
                      href={`/wishlist/${place.id}`} 
                      onClick={() => placeCache.set(place.id, place)}
                      prefetch={true}
                    >
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm leading-snug line-clamp-2 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {place.name}
                      </h3>
                    </Link>

                    {/* Kategori */}
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1 mb-2 truncate">
                      <CategoryIcon category={place.category} size={11} className="shrink-0 text-primary-500" />
                      <span>{place.category}</span>
                    </p>

                    {/* TAG KOTA MURNI & TAG JARAK GPS */}
                    {(place.city || place.distance) && (
                      <div className="flex flex-wrap items-center gap-1 mb-2">
                        {/* Tag Kota Murni (Sleman, Yogyakarta, dll) */}
                        {place.city && (
                          <span 
                            title={place.city}
                            className="text-[9px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0"
                          >
                            <Building2 size={9} className="shrink-0 text-blue-500" />
                            <span className="truncate max-w-[85px]">{place.city}</span>
                          </span>
                        )}

                        {/* Tag Jarak GPS Realtime */}
                        {place.distance && (
                          <span className="text-[9px] font-extrabold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900/40 px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                            <MapPin size={9} className="shrink-0 text-rose-500" />
                            <span>{place.distance}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Tag Pelengkap (Romantic, Budget, dll) */}
                    {place.tags && place.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {place.tags.slice(0, 2).map((tag: any, idx: number) => {
                          const tagName = tag.name || tag.m_tags?.name || "Tag";
                          const tagColor = tag.color || tag.m_tags?.color || "#ec4899";
                          const contrast = getContrastTextColor(tagColor);
                          return (
                            <span
                              key={idx}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs leading-none"
                              style={{ backgroundColor: tagColor, color: contrast }}
                            >
                              #{tagName}
                            </span>
                          );
                        })}
                        {place.tags.length > 2 && (
                          <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 self-center">
                            +{place.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 3. Action Bar Card: Hanya Maps & Detail (NO VIDEO BUTTON!) */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-800/80 mt-1">
                    {/* Maps Link Button */}
                    {place.gmaps_link ? (
                      <a 
                        href={place.gmaps_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition flex items-center justify-center shrink-0" 
                        title="Petunjuk Arah Google Maps"
                      >
                        <Navigation size={13} />
                      </a>
                    ) : null}

                    {/* Full Detail Link Button */}
                    <Link 
                      href={`/wishlist/${place.id}`} 
                      onClick={() => placeCache.set(place.id, place)}
                      prefetch={true}
                      className="flex-1 py-1.5 px-2 bg-gray-100 dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-950/40 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1"
                    >
                      <span>Detail</span>
                      <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- FILTER DRAWER MODAL --- */}
      <WishlistFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
        availableCities={availableCities}
        availableCategories={categories}
        availableTags={masterTags}
        hasGps={Boolean(userLocation)}
        onRequestGps={requestGps}
        matchingCount={filteredPlaces.length}
      />

      {/* --- GACHA MODAL POPUP --- */}
      {isGachaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-xs shadow-2xl relative text-center border border-transparent dark:border-gray-800">
            <button 
              onClick={() => setIsGachaOpen(false)} 
              className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition"
            >
              <X size={22} />
            </button>
            
            <div className={`w-14 h-14 mx-auto bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white mb-3 shadow-lg ${isSpinning ? "animate-spin" : ""}`}>
              <Dice5 size={28} />
            </div>
            
            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-2">
              {isSpinning ? "Mengocok Pilihan..." : "Pemenangnya Adalah!"}
            </h2>

            {/* Radius Selector Pills */}
            <div className="mb-4">
              <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl gap-1">
                {[
                  { label: "Bebas", value: "all" as const },
                  { label: "3 km", value: 3 },
                  { label: "5 km", value: 5 },
                  { label: "10 km", value: 10 },
                ].map((pill) => {
                  const isActive = gachaRadius === pill.value;
                  return (
                    <button
                      key={pill.label}
                      type="button"
                      disabled={isSpinning}
                      onClick={() => handleGacha(pill.value)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                        isActive
                          ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-300 shadow-xs"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                      } ${isSpinning ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {pill.label}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {gachaResult && (
              <div className="transition-all duration-500 transform scale-100">
                <div className="w-full h-32 rounded-xl overflow-hidden mb-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-inner relative">
                  <ImageWithFallback 
                    src={gachaResult.image_url} 
                    alt={gachaResult.name}
                    fill
                    sizes="250px"
                    className="object-cover" 
                  />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1 leading-snug line-clamp-1">{gachaResult.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center justify-center gap-1.5">
                  <CategoryIcon category={gachaResult.category} size={13} className="shrink-0 text-primary-500" />
                  <span>{gachaResult.category} • {gachaResult.price_level}</span>
                </p>

                {(gachaResult.distance || gachaResult.city) && (
                  <div className="flex items-center justify-center gap-1.5 flex-wrap mb-3">
                    {gachaResult.city && (
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[11px] font-bold rounded-full border border-blue-100 dark:border-blue-900/40">
                        <Building2 size={10} className="shrink-0 text-blue-500" />
                        <span>{gachaResult.city}</span>
                      </div>
                    )}
                    {gachaResult.distance && (
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[11px] font-bold rounded-full border border-rose-100 dark:border-rose-900/40">
                        <MapPin size={10} className="shrink-0 text-rose-500" />
                        <span>{gachaResult.distance}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex flex-col gap-2 mt-2">
                  <Link 
                    href={`/wishlist/${gachaResult.id}`} 
                    onClick={() => placeCache.set(gachaResult.id, gachaResult)}
                    className="w-full"
                  >
                    <Button className="w-full shadow-lg shadow-primary-500/20 py-2.5 text-xs font-bold">
                      Lihat Detail
                    </Button>
                  </Link>
                  <div className="flex gap-2">
                    {gachaResult.gmaps_link && (
                      <a 
                        href={gachaResult.gmaps_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold rounded-xl text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50 transition flex items-center justify-center gap-1"
                      >
                        <Navigation size={13}/> Maps
                      </a>
                    )}
                    {!isSpinning && (
                      <button 
                        onClick={() => handleGacha(gachaRadius)} 
                        className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold rounded-xl text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                      >
                        Kocok Ulang
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- SINGLE FLOATING ACTION BUTTON (FAB) DI BAWAH --- */}
      <FloatingAddButton label="Tambah Wishlist" />

    </div>
  );
}

export default function WishlistPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WishlistContent />
    </Suspense>
  );
}

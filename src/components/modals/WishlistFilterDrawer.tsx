"use client";

import { useMemo } from "react";
import { 
  X, RotateCcw, Building2, Tag as TagIcon, 
  MapPin, DollarSign, Check, ArrowUpDown, Utensils
} from "lucide-react";
import CategoryIcon from "@/components/ui/CategoryIcon";
import { getContrastTextColor } from "@/lib/tagColor";
import { Category, Tag } from "@/types";

export type SortOption = "newest" | "nearest" | "name_asc" | "price_asc" | "price_desc";

export interface WishlistFilterState {
  cities: string[];
  categories: string[];
  tags: number[]; // tag IDs
  priceLevels: string[]; // ["$", "$$", "$$$"]
  maxDistanceKm: number | null; // null = Bebas
  sortBy: SortOption;
}

interface WishlistFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: WishlistFilterState;
  onChange: (filters: WishlistFilterState) => void;
  onReset: () => void;
  availableCities: { name: string; count: number }[];
  availableCategories: Category[];
  availableTags: Tag[];
  hasGps: boolean;
  onRequestGps: () => void;
  matchingCount: number;
}

export default function WishlistFilterDrawer({
  isOpen,
  onClose,
  filters,
  onChange,
  onReset,
  availableCities,
  availableCategories,
  availableTags,
  hasGps,
  onRequestGps,
  matchingCount,
}: WishlistFilterDrawerProps) {
  if (!isOpen) return null;

  // Toggle Kota
  const toggleCity = (city: string) => {
    const next = filters.cities.includes(city)
      ? filters.cities.filter((c) => c !== city)
      : [...filters.cities, city];
    onChange({ ...filters, cities: next });
  };

  // Toggle Category
  const toggleCategory = (catName: string) => {
    const next = filters.categories.includes(catName)
      ? filters.categories.filter((c) => c !== catName)
      : [...filters.categories, catName];
    onChange({ ...filters, categories: next });
  };

  // Toggle Tag
  const toggleTag = (tagId: number) => {
    const next = filters.tags.includes(tagId)
      ? filters.tags.filter((t) => t !== tagId)
      : [...filters.tags, tagId];
    onChange({ ...filters, tags: next });
  };

  // Toggle Price Level
  const togglePrice = (price: string) => {
    const next = filters.priceLevels.includes(price)
      ? filters.priceLevels.filter((p) => p !== price)
      : [...filters.priceLevels, price];
    onChange({ ...filters, priceLevels: next });
  };

  // Count active filter criteria
  const activeCount = 
    filters.cities.length +
    filters.categories.length +
    filters.tags.length +
    filters.priceLevels.length +
    (filters.maxDistanceKm ? 1 : 0) +
    (filters.sortBy !== "newest" ? 1 : 0);

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-gray-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl relative max-h-[88vh] flex flex-col border border-transparent dark:border-gray-800 animate-in slide-in-from-bottom-4 duration-300"
      >
        {/* --- HEADER --- */}
        <div className="px-6 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Filter & Urutkan
            </h2>
            {activeCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 text-[11px] font-extrabold">
                {activeCount} Aktif
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button
                type="button"
                onClick={onReset}
                className="text-xs font-semibold text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* --- BODY SCROLLABLE --- */}
        <div className="px-6 py-4 overflow-y-auto space-y-6 flex-1 text-sm no-scrollbar">

          {/* 1. URUTKAN / SORTING */}
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2.5 flex items-center gap-1.5 uppercase tracking-wider">
              <ArrowUpDown size={13} className="text-primary-500" />
              <span>Urutan Tampilan</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "newest" as SortOption, label: "Terbaru Ditambahkan", icon: "🕒" },
                { 
                  id: "nearest" as SortOption, 
                  label: "Paling Dekat (GPS)", 
                  icon: "📍",
                  disabled: !hasGps,
                  hint: !hasGps ? "Perlu GPS" : undefined
                },
                { id: "name_asc" as SortOption, label: "Nama Tempat (A-Z)", icon: "🔤" },
                { id: "price_asc" as SortOption, label: "Harga Termurah", icon: "💸" },
                { id: "price_desc" as SortOption, label: "Harga Termahal", icon: "💎" },
              ].map((opt) => {
                const isSelected = filters.sortBy === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      if (opt.id === "nearest" && !hasGps) {
                        onRequestGps();
                      }
                      onChange({ ...filters, sortBy: opt.id });
                    }}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border text-left transition-all ${
                      isSelected
                        ? "bg-primary-500 text-white border-primary-500 shadow-sm shadow-primary-500/25"
                        : "bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                    }`}
                  >
                    <span className="text-sm shrink-0">{opt.icon}</span>
                    <span className="truncate flex-1">{opt.label}</span>
                    {isSelected && <Check size={14} className="shrink-0 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. KOTA / KABUPATEN (PURE NAMES) */}
          {availableCities.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Building2 size={13} className="text-blue-500" />
                  <span>Kota / Kabupaten</span>
                </label>
                {filters.cities.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, cities: [] })}
                    className="text-[11px] text-primary-600 dark:text-primary-400 font-semibold hover:underline"
                  >
                    Pilih Semua
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableCities.map((c) => {
                  const isSelected = filters.cities.includes(c.name);
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => toggleCity(c.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20"
                          : "bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-950/80"
                      }`}
                    >
                      <span>{c.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected 
                          ? "bg-white/20 text-white" 
                          : "bg-blue-200/60 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200"
                      }`}>
                        {c.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. KATEGORI */}
          {availableCategories.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Utensils size={13} className="text-emerald-500" />
                  <span>Kategori</span>
                </label>
                {filters.categories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, categories: [] })}
                    className="text-[11px] text-primary-600 dark:text-primary-400 font-semibold hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((cat) => {
                  const isSelected = filters.categories.includes(cat.name);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20"
                          : "bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                      }`}
                    >
                      <CategoryIcon category={cat.name} size={13} className="shrink-0" />
                      <span>{cat.name}</span>
                      {isSelected && <Check size={12} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. RANGE HARGA */}
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2.5 flex items-center gap-1.5 uppercase tracking-wider">
              <DollarSign size={13} className="text-amber-500" />
              <span>Tingkat Harga</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { level: "$", label: "Hemat", range: "< 30rb" },
                { level: "$$", label: "Sedang", range: "30k - 100k" },
                { level: "$$$", label: "Spesial", range: "> 100rb" },
              ].map((p) => {
                const isSelected = filters.priceLevels.includes(p.level);
                return (
                  <button
                    key={p.level}
                    type="button"
                    onClick={() => togglePrice(p.level)}
                    className={`py-2.5 px-2 rounded-xl text-center border transition-all ${
                      isSelected
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/25"
                        : "bg-amber-50/50 dark:bg-amber-950/20 text-gray-700 dark:text-gray-300 border-amber-100 dark:border-amber-900/30 hover:border-amber-300"
                    }`}
                  >
                    <div className="font-black text-sm">{p.level}</div>
                    <div className={`text-[10px] font-semibold ${isSelected ? "text-amber-100" : "text-amber-600 dark:text-amber-400"}`}>
                      {p.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. RADIUS JARAK (GPS) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 uppercase tracking-wider">
                <MapPin size={13} className="text-rose-500" />
                <span>Radius Jarak Maksimal</span>
              </label>
              <span className="text-xs font-extrabold text-primary-600 dark:text-primary-400">
                {filters.maxDistanceKm ? `${filters.maxDistanceKm} km` : "Bebas Radius"}
              </span>
            </div>

            {!hasGps && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 rounded-xl mb-2.5 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
                <span>GPS belum aktif</span>
                <button
                  type="button"
                  onClick={onRequestGps}
                  className="font-bold underline hover:text-rose-900"
                >
                  Aktifkan GPS
                </button>
              </div>
            )}

            <div className="grid grid-cols-5 gap-1.5">
              {[
                { label: "Bebas", value: null },
                { label: "3 km", value: 3 },
                { label: "5 km", value: 5 },
                { label: "10 km", value: 10 },
                { label: "20 km", value: 20 },
              ].map((rad) => {
                const isSelected = filters.maxDistanceKm === rad.value;
                return (
                  <button
                    key={rad.label}
                    type="button"
                    onClick={() => {
                      if (rad.value !== null && !hasGps) onRequestGps();
                      onChange({ ...filters, maxDistanceKm: rad.value });
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      isSelected
                        ? "bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/25"
                        : "bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-gray-800 hover:border-gray-300"
                    }`}
                  >
                    {rad.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. TAGS FILTER */}
          {availableTags.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <TagIcon size={13} className="text-purple-500" />
                  <span>Filter Tag</span>
                </label>
                {filters.tags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, tags: [] })}
                    className="text-[11px] text-primary-600 dark:text-primary-400 font-semibold hover:underline"
                  >
                    Reset Tag
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto no-scrollbar p-1">
                {availableTags.map((t) => {
                  const isSelected = filters.tags.includes(t.id);
                  const tagColor = t.color || "#ec4899";
                  const contrast = getContrastTextColor(tagColor);

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTag(t.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        isSelected
                          ? "ring-2 ring-offset-2 ring-primary-500 scale-105 shadow-sm"
                          : "opacity-75 hover:opacity-100 hover:scale-102"
                      }`}
                      style={{
                        backgroundColor: tagColor,
                        color: contrast,
                      }}
                    >
                      <span>#{t.name}</span>
                      {isSelected && <Check size={11} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* --- FOOTER CTA --- */}
        <div className="p-4 px-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/70 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-gradient-to-r from-primary-500 to-rose-500 hover:from-primary-600 hover:to-rose-600 active:scale-98 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-primary-500/30 transition text-sm flex items-center justify-center gap-2"
          >
            <span>Terapkan Filter</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-extrabold">
              {matchingCount} Tempat
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}


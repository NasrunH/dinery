import { Place } from "@/types";

// In-memory cache singleton (bertahan selama lifecycle tab/sesi browser)
const memoryCache = new Map<string, Place>();

export const placeCache = {
  /**
   * Menyimpan data tempat (parsial atau penuh) ke cache memori & sessionStorage
   */
  set: (id: string | number | undefined, data: Partial<Place> | any) => {
    if (!id || !data) return;
    const key = String(id);

    const existing = memoryCache.get(key) || ({} as Partial<Place>);

    // Normalisasi struktur agar sesuai dengan interface Place
    const normalized: Place = {
      id: key,
      name: data.name || existing.name || "Tempat Kuliner",
      image_url:
        data.image_url ||
        data.meta_image ||
        data.image ||
        existing.image_url ||
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
      original_link: data.original_link || existing.original_link,
      platform: data.platform || existing.platform,
      category: data.category || data.m_categories?.name || existing.category || "Kuliner",
      category_icon: data.category_icon || data.m_categories?.icon || existing.category_icon || "",
      price_level: data.price_level || data.m_price_ranges?.label || existing.price_level || "$$",
      price_description: data.price_description || data.m_price_ranges?.description || existing.price_description,
      tags: data.tags || (data.place_tags ? data.place_tags.map((t: any) => t.m_tags) : existing.tags) || [],
      gmaps_link: data.gmaps_link || data.maps_link || existing.gmaps_link,
      address_text: data.address_text || existing.address_text || "",
      location: data.location || existing.location,
      target_menu: data.target_menu || existing.target_menu || "",
      description: data.description || data.meta_title || existing.description || "",
      created_by_name:
        data.created_by_name ||
        data.created_by_user?.display_name ||
        existing.created_by_name ||
        "Pasanganmu",
      created_at: data.created_at || existing.created_at,
      distance: data.distance || (data.dist_meters ? `${(data.dist_meters / 1000).toFixed(1)} km` : existing.distance),
      visits: data.visits || existing.visits || []
    };

    memoryCache.set(key, normalized);

    // Simpan ke sessionStorage agar transisi halaman cepat & tahan refresh
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(`dinery_cached_place_${key}`, JSON.stringify(normalized));
      } catch {}
    }
  },

  /**
   * Menyimpan banyak data sekaligus (misal saat daftar wishlist berhasil di-fetch)
   */
  setMany: (places: any[]) => {
    if (!Array.isArray(places)) return;
    places.forEach((p) => {
      const pId = p?.id || p?.place_id;
      if (pId) {
        placeCache.set(pId, p);
      }
    });
  },

  /**
   * Mengambil data tempat secara instan (0 ms) dari memoryCache atau sessionStorage
   */
  get: (id: string | number | undefined): Place | null => {
    if (!id) return null;
    const key = String(id);

    if (memoryCache.has(key)) {
      return memoryCache.get(key)!;
    }

    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(`dinery_cached_place_${key}`);
        if (stored) {
          const parsed = JSON.parse(stored) as Place;
          memoryCache.set(key, parsed);
          return parsed;
        }
      } catch {}
    }

    return null;
  }
};


import { parsePostGISPoint } from "@/lib/wkbParser";

const addressCache = new Map<string, string>();

/**
 * Ekstrak koordinat langsung dari berbagai format URL Google Maps
 */
export function extractCoordsFromMapsUrl(url?: string): { lat: number; lng: number } | null {
  if (!url) return null;
  const regexPatterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/
  ];
  for (const regex of regexPatterns) {
    const match = url.match(regex);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
  }
  return null;
}

/**
 * Otomatis mendeteksi alamat lengkap dari Google Maps / Koordinat PostGIS
 */
export async function resolveAddressFromMaps(
  location?: any,
  mapsLink?: string
): Promise<string | null> {
  // 1. Ambil koordinat dari PostGIS Point
  let coords = parsePostGISPoint(location);
  
  // 2. Jika belum dapat, coba ekstrak dari URL Google Maps
  if (!coords && mapsLink) {
    coords = extractCoordsFromMapsUrl(mapsLink);
  }

  if (!coords) return null;

  const cacheKey = `${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}`;
  if (addressCache.has(cacheKey)) {
    return addressCache.get(cacheKey)!;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&addressdetails=1`,
      {
        signal: controller.signal,
        headers: { 'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8' }
      }
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const address = data?.display_name || null;
    if (address) {
      addressCache.set(cacheKey, address);
    }
    return address;
  } catch {
    return null;
  }
}


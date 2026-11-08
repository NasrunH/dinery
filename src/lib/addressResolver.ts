import { parsePostGISPoint } from "@/lib/wkbParser";
import { fetchAPI } from "@/lib/api";

const addressCache = new Map<string, string>();

export const isValidIndo = (lat?: number | null, lng?: number | null): boolean => {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  return lat >= -15 && lat <= 10 && lng >= 90 && lng <= 150;
};

export const isForeignAddress = (address?: string | null): boolean => {
  if (!address || typeof address !== 'string') return false;
  const lower = address.toLowerCase();
  // Jika secara eksplisit memuat kata indonesia, maka dipastikan bukan alamat luar negeri
  if (lower.includes('indonesia')) return false;
  return (
    lower.includes('virginia') ||
    lower.includes('amerika serikat') ||
    lower.includes('united states') ||
    lower.includes('archbold') ||
    lower.includes('loudoun') ||
    lower.includes('ashburn') ||
    lower.includes('california') ||
    lower.includes('washington') ||
    /\busa\b/i.test(lower)
  );
};

/**
 * Ekstrak alamat langsung dari URL Google Maps yang memiliki format /maps/place/Nama, Alamat/...
 */
export function extractAddressFromMapsUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const placeMatch = url.match(/\/maps\/place\/([^/?#]+)/);
    if (placeMatch && placeMatch[1]) {
      let decoded = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      decoded = decoded.replace(/@.*$/, '').trim();
      const parts = decoded.split(',');
      if (parts.length > 1) {
        const addressPart = parts.slice(1).join(',').trim();
        if (addressPart.length > 5 && !isForeignAddress(addressPart)) {
          return addressPart;
        }
      }
    }
  } catch {}
  return null;
}

/**
 * Ekstrak koordinat langsung dari berbagai format URL Google Maps dengan validasi wilayah Indonesia
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
      if (isValidIndo(lat, lng)) return { lat, lng };
    }
  }
  return null;
}

/**
 * Otomatis mendeteksi alamat via Backend API (Backend yang menangani reverse geocoding OpenStreetMap & caching)
 */
export async function resolveAddressFromMaps(
  location?: unknown,
  mapsLink?: string
): Promise<string | null> {
  // 1. Coba ambil alamat instan dari URL Google Maps jika sudah ada di link (0ms)
  const urlAddress = extractAddressFromMapsUrl(mapsLink);
  if (urlAddress && !isForeignAddress(urlAddress)) return urlAddress;

  // 2. Cek cache lokal di browser
  let coords = parsePostGISPoint(location);
  if ((!coords || !isValidIndo(coords.lat, coords.lng)) && mapsLink) {
    coords = extractCoordsFromMapsUrl(mapsLink);
  }

  const cacheKey = coords ? `${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}` : (mapsLink || "");
  if (cacheKey && addressCache.has(cacheKey)) {
    return addressCache.get(cacheKey)!;
  }

  // 3. Panggil endpoint Backend Dinery (/places/reverse-geocode)
  // Backend yang melakukan caching dan reverse geocoding ke OSM secara terpusat
  try {
    const res = await fetchAPI("/places/reverse-geocode", {
      method: "POST",
      body: JSON.stringify({
        location,
        maps_link: mapsLink,
        lat: coords?.lat,
        long: coords?.lng,
      }),
    });

    const addr = res?.data?.address_text;
    if (addr && !isForeignAddress(addr)) {
      if (cacheKey) addressCache.set(cacheKey, addr);
      return addr;
    }
    return null;
  } catch (err) {
    console.warn("[addressResolver] Backend reverse-geocode error:", err);
    return null;
  }
}

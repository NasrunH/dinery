import { parsePostGISPoint } from "@/lib/wkbParser";

const addressCache = new Map<string, string>();

export const isValidIndo = (lat?: number | null, lng?: number | null): boolean => {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  return lat >= -15 && lat <= 10 && lng >= 90 && lng <= 150;
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
        if (addressPart.length > 5 && !addressPart.toLowerCase().includes('united states') && !addressPart.toLowerCase().includes('amerika serikat')) {
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
 * Otomatis mendeteksi alamat lengkap dari Google Maps / Koordinat PostGIS
 */
export async function resolveAddressFromMaps(
  location?: any,
  mapsLink?: string
): Promise<string | null> {
  // 1. Coba ambil alamat langsung dari URL Google Maps jika link sudah terbuka
  const urlAddress = extractAddressFromMapsUrl(mapsLink);
  if (urlAddress) return urlAddress;

  // 2. Ambil koordinat dari PostGIS Point
  let coords = parsePostGISPoint(location);
  
  // 3. Jika belum dapat, coba ekstrak dari URL Google Maps
  if ((!coords || !isValidIndo(coords.lat, coords.lng)) && mapsLink) {
    coords = extractCoordsFromMapsUrl(mapsLink);
  }

  if (!coords || !isValidIndo(coords.lat, coords.lng)) return null;

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
      if (address.includes('Amerika') || address.includes('United States') || address.includes('Virginia')) {
        return null;
      }
      addressCache.set(cacheKey, address);
      return address;
    }
    return null;
  } catch {
    return null;
  }
}

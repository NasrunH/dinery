/**
 * Helper untuk mengekstrak nama Kabupaten/Kota dari teks alamat (Google Maps / OpenStreetMap)
 * Mendukung format bahasa Indonesia (Kabupaten X, Kota Y, Kab. Z) maupun format OSM/Inggris (Regency).
 */
export function extractCityFromAddress(address?: string | null): string | null {
  if (!address || typeof address !== "string") return null;
  const text = address.trim();
  if (!text) return null;

  // 1. Explicit pattern: 'Kota <Name>' atau 'Kabupaten <Name>' atau 'Kab. <Name>'
  const explicitMatch = text.match(/(?:Kota|Kabupaten|Kab\.)\s+([A-Za-z\s]+?)(?:,|$|\d|\n)/i);
  if (explicitMatch && explicitMatch[1]) {
    const rawName = explicitMatch[1].trim();
    if (rawName && !/^(indonesia|daerah|provinsi)/i.test(rawName)) {
      const cleanName = rawName.split(/[,·•\n]/)[0].trim();
      return cleanName;
    }
  }

  // 2. Format Regency (e.g. 'Sleman Regency', 'Bantul Regency')
  const regencyMatch = text.match(/([A-Za-z]+)\s+Regency/i);
  if (regencyMatch && regencyMatch[1]) {
    return regencyMatch[1].trim();
  }

  // 3. Wilayah Kota Administrasi DKI Jakarta
  const jakartaMatches = [
    "Jakarta Selatan",
    "Jakarta Pusat",
    "Jakarta Barat",
    "Jakarta Timur",
    "Jakarta Utara",
  ];
  for (const jkt of jakartaMatches) {
    if (new RegExp(`\\b${jkt}\\b`, "i").test(text)) {
      return jkt;
    }
  }

  // 4. Daftar Kabupaten populer di Indonesia
  const knownKabupaten = [
    "Sleman",
    "Bantul",
    "Gunungkidul",
    "Kulon Progo",
    "Klaten",
    "Boyolali",
    "Sidoarjo",
    "Badung",
    "Gianyar",
    "Sukoharjo",
    "Karanganyar",
    "Wonogiri",
    "Sragen",
    "Kendal",
    "Demak",
    "Cilacap",
    "Banyumas",
    "Banyuwangi",
    "Pasuruan",
    "Jember",
  ];
  for (const kab of knownKabupaten) {
    if (new RegExp(`\\b${kab}\\b`, "i").test(text)) {
      return kab;
    }
  }

  // 5. Daftar Kota populer di Indonesia
  const knownKota = [
    "Yogyakarta",
    "Surakarta",
    "Solo",
    "Semarang",
    "Salatiga",
    "Magelang",
    "Bandung",
    "Bogor",
    "Depok",
    "Bekasi",
    "Tangerang Selatan",
    "Tangerang",
    "Surabaya",
    "Malang",
    "Denpasar",
    "Cirebon",
    "Pekalongan",
    "Tegal",
    "Madiun",
    "Kediri",
  ];
  for (const kota of knownKota) {
    if (kota === "Yogyakarta") {
      // Pastikan bukan sekadar bagian dari 'Daerah Istimewa Yogyakarta'
      const withoutProvince = text.replace(
        /Daerah Istimewa Yogyakarta|D\.?I\.?\s*Yogyakarta|DIY/gi,
        ""
      );
      if (/\bYogyakarta\b/i.test(withoutProvince)) {
        return "Yogyakarta";
      }
    } else if (new RegExp(`\\b${kota}\\b`, "i").test(text)) {
      return kota === "Solo" ? "Surakarta" : kota;
    }
  }

  // 6. Token parsing fallback dari format koma terbalik OSM
  const tokens = text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i];
    if (/^\d{5}$/.test(token) || /^\d+$/.test(token)) continue;
    if (/indonesia/i.test(token)) continue;
    if (
      /^(daerah istimewa yogyakarta|d\.i\. yogyakarta|diy|jawa tengah|jawa timur|jawa barat|dki jakarta|banten|bali)/i.test(
        token
      )
    )
      continue;
    if (/^kecamatan|^kec\./i.test(token)) continue;
    if (token.length > 2 && token.length < 28) {
      return token;
    }
  }

  return null;
}

/**
 * Menghitung jarak garis lurus (Haversine Formula) dalam format ramah pengguna ("1.2 km" atau "850 m")
 */
export function formatDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): string | null {
  if (
    typeof lat1 !== "number" ||
    typeof lon1 !== "number" ||
    typeof lat2 !== "number" ||
    typeof lon2 !== "number" ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return null;
  }

  const R = 6371; // Radius bumi dalam KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distKm = R * c;

  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m`;
  }
  return `${distKm.toFixed(1)} km`;
}


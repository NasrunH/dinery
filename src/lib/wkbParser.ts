/**
 * Helper untuk parsing lokasi koordinat dari berbagai format:
 * 1. PostGIS EWKB (Extended Well-Known Binary) Hex String ("0101000020E6100000...")
 * 2. WKT String format: "POINT(106.8456 -6.2088)"
 * 3. GeoJSON Point: { type: "Point", coordinates: [lng, lat] }
 * 4. Object dengan { lat, lng } atau { lat, long }
 */
export function parsePostGISPoint(location: any): { lat: number; lng: number } | null {
    if (!location) return null;

    // 1. Direct object format
    if (typeof location === 'object') {
        if (typeof location.lat === 'number' && typeof location.lng === 'number') {
            return { lat: location.lat, lng: location.lng };
        }
        if (typeof location.lat === 'number' && typeof location.long === 'number') {
            return { lat: location.lat, lng: location.long };
        }
        // GeoJSON: { coordinates: [lng, lat] }
        if (Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
            const lng = Number(location.coordinates[0]);
            const lat = Number(location.coordinates[1]);
            if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
        }
    }

    if (typeof location !== 'string') return null;

    // 2. WKT format "POINT(long lat)"
    const pointMatch = location.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (pointMatch) {
        const lng = parseFloat(pointMatch[1]);
        const lat = parseFloat(pointMatch[2]);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return { lat, lng };
        }
    }

    // 3. PostGIS EWKB Hex String
    try {
        const cleanHex = location.replace(/^\\x/, '');
        if (cleanHex.length < 16) return null;

        const buffer = new ArrayBuffer(cleanHex.length / 2);
        const view = new DataView(buffer);
        for (let i = 0; i < cleanHex.length; i += 2) {
            const byte = parseInt(cleanHex.substring(i, i + 2), 16);
            view.setUint8(i / 2, byte);
        }

        const isLittleEndian = view.getUint8(0) === 1;
        const type = view.getUint32(1, isLittleEndian);

        let offset = 5;
        if ((type & 0x20000000) !== 0) {
            offset += 4; // Skip 4 byte SRID
        }

        const lng = view.getFloat64(offset, isLittleEndian);
        const lat = view.getFloat64(offset + 8, isLittleEndian);

        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return { lat, lng };
        }

        return null;
    } catch (err) {
        console.error("Gagal parse WKB Hex:", err);
        return null;
    }
}

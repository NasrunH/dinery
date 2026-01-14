/**
 * Helper sederhana untuk parsing PostGIS EWKB (Extended Well-Known Binary) Hex String.
 * Khusus untuk tipe Geometry POINT dengan SRID (format default PostGIS).
 * * Format input: "0101000020E6100000..."
 */
export function parsePostGISPoint(hex: string | null | undefined): { lat: number; lng: number } | null {
    if (!hex || typeof hex !== 'string') return null;

    try {
        // 1. Bersihkan string hex
        const cleanHex = hex.replace(/^\\x/, ''); // Hapus prefix \x jika ada

        // 2. Convert Hex String ke ArrayBuffer
        const buffer = new ArrayBuffer(cleanHex.length / 2);
        const view = new DataView(buffer);
        for (let i = 0; i < cleanHex.length; i += 2) {
            const byte = parseInt(cleanHex.substring(i, i + 2), 16);
            view.setUint8(i / 2, byte);
        }

        // 3. Baca Endianness (Byte 0)
        // 01 = Little Endian (NDR), 00 = Big Endian (XDR)
        const isLittleEndian = view.getUint8(0) === 1;

        // 4. Baca Type (Byte 1-4)
        const type = view.getUint32(1, isLittleEndian);

        // OFFSET KALKULASI:
        // Byte 0: Endianness (1 byte)
        // Byte 1-4: Type (4 bytes). Biasanya 0x20000001 (Point + SRID)
        // Byte 5-8: SRID (4 bytes) -> Kita skip ini (biasanya 4326)
        // Byte 9-16: X / Longitude (8 bytes - Double)
        // Byte 17-24: Y / Latitude (8 bytes - Double)

        // Cek apakah tipe datanya mengandung SRID (flag 0x20000000)
        // Jika ada SRID, koordinat mulai di byte ke-9. Jika tidak, di byte ke-5.
        // Berdasarkan contoh data kamu "0101000020...", ini ada SRID-nya.
        
        let offset = 5;
        // Cek bit mask untuk SRID (EWKB standard)
        if ((type & 0x20000000) !== 0) {
            offset += 4; // Skip 4 byte SRID
        }

        const lng = view.getFloat64(offset, isLittleEndian);     // X is Longitude
        const lat = view.getFloat64(offset + 8, isLittleEndian); // Y is Latitude

        // Validasi dasar lat/long (simple sanity check)
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return { lat, lng };
        }
        
        return null;

    } catch (err) {
        console.error("Gagal parse WKB Hex:", err);
        return null;
    }
}
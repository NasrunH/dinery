/**
 * Menghitung warna teks (hitam/putih) berdasarkan kontras warna latar belakang (YIQ formula)
 */
export function getContrastTextColor(hexColor?: string): string {
  if (!hexColor) return "#ffffff";
  let hex = hexColor.replace("#", "").trim();
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  if (hex.length >= 6) {
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 160 ? "#111827" : "#ffffff";
  }
  return "#ffffff";
}

/**
 * Menghasilkan style CSS untuk tag badge dengan warna custom
 */
export function getTagStyle(tagColor?: string, isSelected: boolean = true) {
  const color = tagColor || "#ec4899";
  if (isSelected) {
    return {
      backgroundColor: color,
      color: getContrastTextColor(color),
      borderColor: color,
    };
  }
  return {
    borderColor: `${color}50`,
  };
}

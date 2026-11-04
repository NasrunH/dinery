// 1. Definisikan API_URL (Gunakan Env Variable atau Fallback ke Production)
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://be-dinery.vercel.app/api";

// 2. [PENTING] Buat alias BASE_URL agar kompatibel dengan file lain yang mengimportnya
export const BASE_URL = API_URL; 

export async function fetchAPI(endpoint: string, options: RequestInit & { skipAuthRedirect?: boolean } = {}) {
  // Gunakan 'dinery_token' agar konsisten dengan AuthContext
  const token = typeof window !== "undefined" ? localStorage.getItem("dinery_token") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    (headers as any)["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, config);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({})); 

    // Handle 401 (Unauthorized)
    if (res.status === 401) {
       const isAuthRequest = endpoint.includes("/auth/login") || endpoint.includes("/auth/register");
       
       if (!isAuthRequest && !options.skipAuthRedirect && typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
          // Hapus token yang benar saat logout paksa
          localStorage.removeItem("dinery_token");
          window.location.href = "/login";
          const authError = new Error("Sesi Anda telah berakhir. Silakan login kembali.");
          (authError as any).status = 401;
          throw authError;
       }
    }

    const err = new Error(errorData.message || res.statusText || `Request gagal (${res.status})`);
    (err as any).status = res.status;
    (err as any).error = errorData.error;
    (err as any).data = errorData;
    throw err;
  }

  return res.json();
}

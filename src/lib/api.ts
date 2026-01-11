export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://be-dinery.vercel.app/api";

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  // [PERBAIKAN] Gunakan 'dinery_token' agar konsisten dengan AuthContext lama
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
       
       if (!isAuthRequest && typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
          // [PERBAIKAN] Hapus token yang benar saat logout paksa
          localStorage.removeItem("dinery_token");
          window.location.href = "/login";
          return; 
       }
    }

    throw { 
        status: res.status, 
        message: errorData.message || res.statusText,
        error: errorData.error 
    };
  }

  return res.json();
}
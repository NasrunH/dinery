export const BASE_URL = 'https://be-dinery.vercel.app/api'; // Pastikan port backend sama

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  let token = '';
  
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('dinery_token') || '';
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    // Jika token expired (401), logout paksa
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('dinery_token');
        window.location.href = '/login';
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Terjadi kesalahan pada server');
    }

    return data;
  } catch (error: any) {
    throw new Error(error.message);
  }
}
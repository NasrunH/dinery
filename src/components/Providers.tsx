"use client";

import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
import { fetchAPI } from "@/lib/api";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SWRConfig
        value={{
          fetcher: fetchAPI,
          revalidateOnFocus: false, // Menghindari fetch ulang berulang saat berpindah tab browser
          revalidateIfStale: true,
          revalidateOnReconnect: true,
          dedupingInterval: 10000, // Deduplikasi request yang sama dalam selang 10 detik
          shouldRetryOnError: false,
        }}
      >
        <AuthProvider>{children}</AuthProvider>
      </SWRConfig>
    </ThemeProvider>
  );
}

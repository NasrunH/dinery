import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { Toaster } from "react-hot-toast"; // [1] Import Toaster

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dinery",
  description: "Aplikasi Couple",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex justify-center text-gray-800 dark:text-gray-100">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 min-h-screen shadow-2xl relative overflow-hidden">
              {children}
            </div>
          </div>
          {/* [2] Tambahkan komponen Toaster di sini */}
          <Toaster 
            position="top-center"
            reverseOrder={false}
            toastOptions={{
              className: '',
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '12px',
                padding: '16px',
              },
              success: {
                style: {
                  background: '#ECFDF5', // Green-50
                  color: '#059669',      // Green-600
                  border: '1px solid #D1FAE5',
                },
                iconTheme: {
                  primary: '#059669',
                  secondary: '#ECFDF5',
                },
              },
              error: {
                style: {
                  background: '#FEF2F2', // Red-50
                  color: '#DC2626',      // Red-600
                  border: '1px solid #FEE2E2',
                },
                iconTheme: {
                  primary: '#DC2626',
                  secondary: '#FEF2F2',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
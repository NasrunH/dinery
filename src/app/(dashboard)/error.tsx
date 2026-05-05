"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 pb-24 text-center">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-6">
        <AlertTriangle size={40} />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Terjadi Kesalahan</h2>
      <p className="text-gray-500 mb-8 max-w-sm">
        Maaf, sistem tidak dapat memuat data. Silakan coba beberapa saat lagi.
      </p>
      <Button onClick={() => reset()} className="w-full max-w-xs shadow-lg shadow-primary-200">
        Coba Lagi
      </Button>
    </div>
  );
}

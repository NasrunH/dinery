"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

interface FloatingAddButtonProps {
  label?: string;
  className?: string;
}

export default function FloatingAddButton({
  label = "Tambah Wishlist",
  className = "",
}: FloatingAddButtonProps) {
  return (
    <div
      className={`fixed bottom-[86px] left-1/2 -translate-x-1/2 w-full max-w-md pointer-events-none z-30 px-5 flex justify-end ${className}`}
    >
      <Link href="/wishlist/add" className="pointer-events-auto">
        <button
          type="button"
          aria-label={label}
          className="flex items-center gap-2 bg-gradient-to-r from-primary-500 via-rose-500 to-pink-500 hover:from-primary-600 hover:to-rose-600 active:scale-95 text-white font-bold text-xs pl-3.5 pr-4 py-3 rounded-full shadow-[0_8px_25px_rgba(244,63,94,0.45)] hover:shadow-[0_12px_30px_rgba(244,63,94,0.6)] hover:-translate-y-0.5 transition-all duration-200 group border border-white/20"
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
            <Plus size={14} strokeWidth={3} />
          </div>
          <span className="tracking-wide">{label}</span>
        </button>
      </Link>
    </div>
  );
}


"use client";

import { useState } from "react";
import { X, Tag as TagIcon, Check, Pipette } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { fetchAPI } from "@/lib/api";
import { Tag } from "@/types";
import { getContrastTextColor } from "@/lib/tagColor";
import toast from "react-hot-toast";

interface CreateTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (tag: Tag) => void;
}

const PRESET_COLORS = [
  "#f43f5e", // Rose
  "#ec4899", // Pink
  "#a855f7", // Purple
  "#3b82f6", // Blue
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#f97316", // Orange
  "#64748b", // Slate
];

export default function CreateTagModal({
  isOpen,
  onClose,
  onCreated,
}: CreateTagModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama tag wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Menyimpan tag baru...");

    try {
      const res = await fetchAPI("/master/tags", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          color: color || "#ec4899",
        }),
      });

      const newTag: Tag = res.data;
      toast.dismiss(loadingToast);
      toast.success(`Tag "${newTag.name}" berhasil dibuat!`);

      // Reset Form & Emit
      setName("");
      setColor(PRESET_COLORS[0]);
      onCreated(newTag);
      onClose();
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.message || "Gagal membuat tag kustom");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contrastColor = getContrastTextColor(color);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 space-y-5 animate-in zoom-in-95 transition-all">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-950/60 border border-primary-200/50 dark:border-primary-900/40 text-primary-500 flex items-center justify-center shrink-0">
              <TagIcon size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                Buat Tag Baru
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Tandai suasana atau menu favorit
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-1 -mt-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input Nama Tag */}
          <div>
            <Input
              label="Nama Tag"
              placeholder="Contoh: Malam Minggu, Street Food..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Pilihan Warna */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ml-1">
              Pilih Warna Tag
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((preset) => {
                const isSelected = color.toLowerCase() === preset.toLowerCase();
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setColor(preset)}
                    className="w-8 h-8 rounded-full transition-transform hover:scale-110 active:scale-95 flex items-center justify-center shadow-xs relative"
                    style={{ backgroundColor: preset }}
                    aria-label={`Pilih warna ${preset}`}
                  >
                    {isSelected && (
                      <Check
                        size={14}
                        strokeWidth={3}
                        style={{ color: getContrastTextColor(preset) }}
                      />
                    )}
                  </button>
                );
              })}

              {/* Custom Color Input with Pipette */}
              <label
                className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 flex items-center justify-center cursor-pointer transition hover:scale-105 relative bg-gray-50 dark:bg-gray-800"
                title="Pilih warna custom"
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
                <Pipette size={14} className="text-gray-400 dark:text-gray-500" />
              </label>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700/80 flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
              Preview Tampilan:
            </span>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold shadow-xs transition-all flex items-center gap-1"
              style={{
                backgroundColor: color,
                color: contrastColor,
              }}
            >
              #{name.trim() || "NamaTag"}
            </span>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 text-gray-500 dark:text-gray-400"
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="flex-1 shadow-lg shadow-primary-500/20"
            >
              Simpan Tag
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


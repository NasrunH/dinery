import { Tag } from "@/types";
import { Plus } from "lucide-react";

interface TagSelectorProps {
  tags: Tag[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export const TagSelector = ({ tags, selectedIds, onChange }: TagSelectorProps) => {
  const toggleTag = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((tagId) => tagId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 ml-1">Tags (Suasana/Fasilitas)</label>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selectedIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                isSelected
                  ? "bg-primary-500 text-white border-primary-500 shadow-sm"
                  : "bg-white text-gray-500 border-gray-200 hover:border-primary-200"
              }`}
            >
              {tag.name}
            </button>
          );
        })}
        {/* Tombol Tambah Custom Tag (Placeholder) */}
        <button
          type="button"
          className="px-3 py-1.5 rounded-full text-xs font-semibold border border-dashed border-gray-300 text-gray-400 hover:text-primary-500 hover:border-primary-300 transition-all flex items-center gap-1"
          onClick={() => alert("Fitur tambah tag baru akan segera hadir!")}
        >
          <Plus size={12} /> Baru
        </button>
      </div>
    </div>
  );
};
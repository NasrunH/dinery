import { Tag } from "@/types";
import { getContrastTextColor } from "@/lib/tagColor";
import { Check } from "lucide-react";

interface TagSelectorProps {
  tags: Tag[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export const TagSelector = ({
  tags,
  selectedIds,
  onChange,
}: TagSelectorProps) => {
  const toggleTag = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((tagId) => tagId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {tags.length === 0 && (
        <span className="text-xs text-gray-400 dark:text-gray-500">
          Tidak ada tag tersedia
        </span>
      )}

      {tags.map((tag) => {
        const isSelected = selectedIds.includes(tag.id);
        const tagColor = tag.color || "#ec4899";
        const contrastTextColor = getContrastTextColor(tagColor);

        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggleTag(tag.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 flex items-center gap-1.5 active:scale-95 ${
              isSelected
                ? "shadow-sm scale-[1.02]"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60"
            }`}
            style={
              isSelected
                ? {
                    backgroundColor: tagColor,
                    color: contrastTextColor,
                    borderColor: tagColor,
                  }
                : {
                    borderColor: `${tagColor}60`,
                  }
            }
          >
            {isSelected ? (
              <Check size={12} strokeWidth={3} className="shrink-0" />
            ) : (
              <span
                className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: tagColor }}
              />
            )}
            <span>{tag.name}</span>
          </button>
        );
      })}
    </div>
  );
};

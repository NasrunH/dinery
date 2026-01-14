import { Tag } from "@/types";

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
        <span className="text-xs text-gray-400">
          Tidak ada tag tersedia
        </span>
      )}

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
                : "bg-white text-gray-500 border-gray-200 hover:border-primary-300 hover:text-primary-500"
            }`}
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
};

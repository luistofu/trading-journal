interface TagSelectorProps {
  value: Array<'Pensamiento' | 'Emoción' | 'Error' | 'Acierto' | 'Aprendizaje' | 'Libre'>;
  onChange: (tags: Array<'Pensamiento' | 'Emoción' | 'Error' | 'Acierto' | 'Aprendizaje' | 'Libre'>) => void;
}

export function TagSelector({ value, onChange }: TagSelectorProps) {
  const tags: Array<{
    id: 'Pensamiento' | 'Emoción' | 'Error' | 'Acierto' | 'Aprendizaje' | 'Libre';
    label: string;
    emoji: string;
  }> = [
    { id: 'Pensamiento', label: 'Pensamiento', emoji: '💭' },
    { id: 'Emoción', label: 'Emoción', emoji: '😌' },
    { id: 'Error', label: 'Error', emoji: '📉' },
    { id: 'Acierto', label: 'Acierto', emoji: '📈' },
    { id: 'Aprendizaje', label: 'Aprendizaje', emoji: '🧠' },
    { id: 'Libre', label: 'Libre', emoji: '📝' },
  ];

  const toggleTag = (tagId: typeof tags[number]['id']) => {
    if (value.includes(tagId)) {
      onChange(value.filter((t) => t !== tagId));
    } else {
      onChange([...value, tagId]);
    }
  };

  return (
    <div className="space-y-2">
      <span className="text-sm text-gray-500 font-light">Etiquetas (opcional):</span>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = value.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-light
                transition-all border
                ${
                  isSelected
                    ? 'bg-[#416E87]/10 border-[#416E87] text-[#416E87]'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-[#416E87]/50'
                }
              `}
            >
              <span className="mr-1">{tag.emoji}</span>
              {tag.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

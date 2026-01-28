interface EmojiSelectorProps {
  value?: '😟' | '😐' | '😌' | '😤' | '💪';
  onChange: (emoji?: '😟' | '😐' | '😌' | '😤' | '💪') => void;
}

export function EmojiSelector({ value, onChange }: EmojiSelectorProps) {
  const emojis: Array<'😟' | '😐' | '😌' | '😤' | '💪'> = ['😟', '😐', '😌', '😤', '💪'];

  return (
    <div className="flex gap-2 items-center">
      <span className="text-sm text-gray-500 font-light">Estado:</span>
      <div className="flex gap-1">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(value === emoji ? undefined : emoji)}
            className={`
              text-2xl w-10 h-10 rounded-lg transition-all
              hover:scale-110 active:scale-95
              ${
                value === emoji
                  ? 'bg-[#416E87]/10 ring-2 ring-[#416E87]'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
          >
            {emoji}
          </button>
        ))}
      </div>
      {value && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="text-xs text-gray-400 hover:text-gray-600 ml-1"
        >
          Quitar
        </button>
      )}
    </div>
  );
}

import { Edit2, Trash2 } from "lucide-react";
import { Note } from "@/app/types";

interface NoteCardProps {
  note: Note;
  onEdit: () => void;
  onDelete: () => void;
  isLocked?: boolean;
}

export function NoteCard({ note, onEdit, onDelete, isLocked }: NoteCardProps) {
  const tagLabels: Record<string, { emoji: string; label: string }> = {
    Pensamiento: { emoji: '💭', label: 'Pensamiento' },
    Emoción: { emoji: '😌', label: 'Emoción' },
    Error: { emoji: '📉', label: 'Error' },
    Acierto: { emoji: '📈', label: 'Acierto' },
    Aprendizaje: { emoji: '🧠', label: 'Aprendizaje' },
    Libre: { emoji: '📝', label: 'Libre' },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-3 hover:shadow-md transition-shadow">
      {/* Header: Date, Emoji, Actions */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 dark:text-gray-500 font-light">
            {new Date(note.date).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          {note.emoji && (
            <span className="text-2xl">{note.emoji}</span>
          )}
        </div>

        {!isLocked && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="p-1.5 text-gray-400 hover:text-[#416E87] hover:bg-[#416E87]/10 rounded-lg transition-colors"
              title="Editar nota"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Eliminar nota"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-light
                         bg-[#416E87]/5 text-[#416E87] border border-[#416E87]/20"
            >
              <span className="mr-1">{tagLabels[tag]?.emoji}</span>
              {tagLabels[tag]?.label}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="text-gray-700 dark:text-gray-300 font-light leading-relaxed whitespace-pre-wrap">
        {note.content}
      </div>
    </div>
  );
}

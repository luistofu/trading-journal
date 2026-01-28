import { useState } from "react";
import { X } from "lucide-react";
import { Note } from "@/app/types";
import { EmojiSelector } from "@/app/components/EmojiSelector";
import { TagSelector } from "@/app/components/TagSelector";

interface NoteEditorProps {
  note?: Note;
  onSave: (noteData: Omit<Note, 'id' | 'date'>) => void;
  onCancel: () => void;
  isLocked?: boolean;
}

export function NoteEditor({ note, onSave, onCancel, isLocked }: NoteEditorProps) {
  const [emoji, setEmoji] = useState<'😟' | '😐' | '😌' | '😤' | '💪' | undefined>(note?.emoji);
  const [tags, setTags] = useState<Array<'Pensamiento' | 'Emoción' | 'Error' | 'Acierto' | 'Aprendizaje' | 'Libre'>>(note?.tags || []);
  const [content, setContent] = useState(note?.content || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onSave({
      emoji,
      tags,
      content: content.trim(),
    });
  };

  if (isLocked) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Este trimestre está cerrado. No puedes agregar o editar notas.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-light text-gray-900 dark:text-white">
          {note ? 'Editar nota' : 'Nueva nota'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <EmojiSelector value={emoji} onChange={setEmoji} />

      <TagSelector value={tags} onChange={setTags} />

      <div className="space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe lo que tengas en la cabeza… no tiene que ser perfecto."
          rows={8}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 
                     bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white
                     placeholder:text-gray-400 dark:placeholder:text-gray-500
                     focus:outline-none focus:ring-2 focus:ring-[#416E87]/50 focus:border-transparent
                     resize-none font-light"
        />
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-light text-gray-600 dark:text-gray-400 
                     hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!content.trim()}
          className="px-4 py-2 rounded-lg text-sm font-normal text-white bg-[#416E87] 
                     hover:bg-[#355a6d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {note ? 'Guardar cambios' : 'Agregar nota'}
        </button>
      </div>
    </form>
  );
}
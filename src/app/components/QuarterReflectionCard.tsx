import { useState } from "react";
import { Edit2, Save, X } from "lucide-react";
import { QuarterReflection } from "@/app/types";
import { EmojiSelector } from "@/app/components/EmojiSelector";

interface QuarterReflectionCardProps {
  reflection?: QuarterReflection;
  onSave: (reflection: Omit<QuarterReflection, 'createdAt'>) => void;
  isLocked?: boolean;
  year: number;
  quarter: 1 | 2 | 3 | 4;
}

export function QuarterReflectionCard({
  reflection,
  onSave,
  isLocked,
  year,
  quarter,
}: QuarterReflectionCardProps) {
  const [isEditing, setIsEditing] = useState(!reflection);
  const [emoji, setEmoji] = useState<'😟' | '😐' | '😌' | '😤' | '💪' | undefined>(reflection?.emoji);
  const [content, setContent] = useState(reflection?.content || "");

  const handleSave = () => {
    if (!content.trim()) return;

    onSave({
      year,
      quarter,
      emoji,
      content: content.trim(),
      isLocked: isLocked || false,
    });

    setIsEditing(false);
  };

  const handleCancel = () => {
    if (!reflection) {
      // If no reflection exists, reset fields
      setEmoji(undefined);
      setContent("");
    } else {
      // Restore original values
      setEmoji(reflection.emoji);
      setContent(reflection.content);
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-8 space-y-4 border-2 border-purple-200 dark:border-purple-800 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-light text-gray-900 dark:text-white">
            ✨ Reflexión Trimestral
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
            Mira estos 3 meses… ¿qué cambió en ti como trader?
          </p>
        </div>

        {!isLocked && reflection && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-gray-400 hover:text-[#416E87] hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
            title="Editar reflexión"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <EmojiSelector value={emoji} onChange={setEmoji} />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tómate tu tiempo... reflexiona sobre estos 3 meses. ¿Qué aprendiste? ¿Qué cambió en tu manera de operar? ¿Cómo te sientes?"
            rows={10}
            disabled={isLocked}
            className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 dark:border-purple-800
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                       placeholder:text-gray-400 dark:placeholder:text-gray-500
                       focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent
                       resize-none font-light leading-relaxed disabled:opacity-50"
          />

          {!isLocked && (
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-light 
                           text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!content.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-normal text-white 
                           bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                Guardar reflexión
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {emoji && (
            <div className="text-4xl">{emoji}</div>
          )}
          <div className="text-gray-700 dark:text-gray-300 font-light leading-relaxed whitespace-pre-wrap text-base">
            {content || (
              <span className="text-gray-400 italic">
                Aún no has escrito tu reflexión para este trimestre...
              </span>
            )}
          </div>
        </div>
      )}

      {isLocked && (
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
          🔒 Trimestre cerrado - Solo lectura
        </div>
      )}
    </div>
  );
}
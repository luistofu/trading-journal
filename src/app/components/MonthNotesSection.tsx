import { useState } from "react";
import { Plus } from "lucide-react";
import { MonthNotes, Note } from "@/app/types";
import { NoteCard } from "@/app/components/NoteCard";
import { NoteEditor } from "@/app/components/NoteEditor";
import { createDiaryNote, deleteDiaryNote, updateDiaryNote } from "@/app/data/diaryRepo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";

interface MonthNotesSectionProps {
  diaryQuarterId: string;
  monthData: MonthNotes;
  onUpdate: (updatedMonth: MonthNotes) => void;
  isLocked?: boolean;
}

export function MonthNotesSection({ diaryQuarterId, monthData, onUpdate, isLocked }: MonthNotesSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  const handleAddNote = async (noteData: Omit<Note, 'id' | 'date'>) => {
    try {
      const created = await createDiaryNote(diaryQuarterId, monthData.month, noteData);
      onUpdate({
        ...monthData,
        notes: [...monthData.notes, created],
      });
      setIsAdding(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditNote = async (noteData: Omit<Note, 'id' | 'date'>) => {
    if (!editingNote) return;

    const optimistic = monthData.notes.map((note) =>
      note.id === editingNote.id ? { ...note, ...noteData } : note
    );
    onUpdate({ ...monthData, notes: optimistic });

    try {
      const saved = await updateDiaryNote(editingNote.id, noteData);
      onUpdate({
        ...monthData,
        notes: optimistic.map((n) => (n.id === saved.id ? saved : n)),
      });
      setEditingNote(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNote = async () => {
    if (!deleteNoteId) return;

    const toDelete = deleteNoteId;
    onUpdate({
      ...monthData,
      notes: monthData.notes.filter((note) => note.id !== toDelete),
    });

    setDeleteNoteId(null);

    try {
      await deleteDiaryNote(toDelete);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Month Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-light text-gray-700 dark:text-gray-300">
          📅 {monthData.month}
        </h3>
        {!isLocked && !isAdding && !editingNote && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-light
                       text-[#416E87] hover:bg-[#416E87]/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar nota
          </button>
        )}
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        {monthData.notes.length === 0 && !isAdding && (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500 font-light">
            No hay notas para este mes
          </div>
        )}

        {monthData.notes.map((note) => (
          <div key={note.id} className="group">
            {editingNote?.id === note.id ? (
              <NoteEditor
                note={editingNote}
                onSave={handleEditNote}
                onCancel={() => setEditingNote(null)}
                isLocked={isLocked}
              />
            ) : (
              <NoteCard
                note={note}
                onEdit={() => setEditingNote(note)}
                onDelete={() => setDeleteNoteId(note.id)}
                isLocked={isLocked}
              />
            )}
          </div>
        ))}

        {/* Add Note Form */}
        {isAdding && (
          <NoteEditor
            onSave={handleAddNote}
            onCancel={() => setIsAdding(false)}
            isLocked={isLocked}
          />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteNoteId} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta nota?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La nota se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNote}
              className="bg-red-500 hover:bg-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

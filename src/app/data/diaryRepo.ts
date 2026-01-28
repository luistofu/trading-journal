import { supabase } from "@/app/utils/supabaseClient";
import type { MonthNotes, Note, NotesData, QuarterReflection } from "@/app/types";
import { getQuarterMonths } from "@/app/utils/quarterHelpers";

type DiaryQuarterRow = {
  id: string;
  user_id: string;
  year: number;
  quarter: number;
};

type DiaryNoteRow = {
  id: string;
  diary_quarter_id: string;
  month_name: string;
  date: string;
  emoji: string | null;
  tags: string[];
  content: string;
};

type QuarterReflectionRow = {
  id: string;
  diary_quarter_id: string;
  emoji: string | null;
  content: string;
  created_at: string;
};

export class DiaryRepoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiaryRepoError";
  }
}

function assertAuthenticated(userId: string | undefined): asserts userId {
  if (!userId) throw new DiaryRepoError("Not authenticated");
}

async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new DiaryRepoError(error.message);
  assertAuthenticated(data.user?.id);
  return data.user.id;
}

function normalizeEmoji(emoji?: Note["emoji"]): string | null {
  return emoji ?? null;
}

function mapDiaryNoteRowToUi(row: DiaryNoteRow): Note {
  return {
    id: row.id,
    date: row.date,
    emoji: (row.emoji as Note["emoji"]) ?? undefined,
    tags: (row.tags as Note["tags"]) ?? [],
    content: row.content,
  };
}

function mapReflectionRowToUi(
  row: QuarterReflectionRow,
  year: number,
  quarter: 1 | 2 | 3 | 4,
  isLocked: boolean
): QuarterReflection {
  return {
    year,
    quarter,
    emoji: (row.emoji as QuarterReflection["emoji"]) ?? undefined,
    content: row.content,
    createdAt: row.created_at,
    isLocked,
  };
}

export async function ensureDiaryQuarter(year: number, quarter: 1 | 2 | 3 | 4): Promise<{ diaryQuarterId: string }> {
  const userId = await getUserId();

  const { data: existing, error: selectError } = await supabase
    .from("diary_quarters")
    .select("id")
    .eq("year", year)
    .eq("quarter", quarter)
    .maybeSingle();

  if (selectError) throw new DiaryRepoError(selectError.message);
  if (existing?.id) return { diaryQuarterId: existing.id };

  const { data: inserted, error: insertError } = await supabase
    .from("diary_quarters")
    .insert({ user_id: userId, year, quarter })
    .select("id")
    .single();

  if (insertError) throw new DiaryRepoError(insertError.message);
  return { diaryQuarterId: inserted.id };
}

export async function listDiaryNotes(diaryQuarterId: string): Promise<DiaryNoteRow[]> {
  await getUserId();

  const { data, error } = await supabase
    .from("diary_notes")
    .select("id, diary_quarter_id, month_name, date, emoji, tags, content")
    .eq("diary_quarter_id", diaryQuarterId)
    .order("date", { ascending: false });

  if (error) throw new DiaryRepoError(error.message);
  return (data ?? []) as DiaryNoteRow[];
}

export async function createDiaryNote(
  diaryQuarterId: string,
  monthName: string,
  payload: Omit<Note, "id" | "date">
): Promise<Note> {
  await getUserId();

  const { data, error } = await supabase
    .from("diary_notes")
    .insert({
      diary_quarter_id: diaryQuarterId,
      month_name: monthName,
      emoji: normalizeEmoji(payload.emoji),
      tags: payload.tags,
      content: payload.content,
    })
    .select("id, diary_quarter_id, month_name, date, emoji, tags, content")
    .single();

  if (error) throw new DiaryRepoError(error.message);
  return mapDiaryNoteRowToUi(data as DiaryNoteRow);
}

export async function updateDiaryNote(noteId: string, patch: Omit<Note, "id" | "date">): Promise<Note> {
  await getUserId();

  const { data, error } = await supabase
    .from("diary_notes")
    .update({
      emoji: normalizeEmoji(patch.emoji),
      tags: patch.tags,
      content: patch.content,
    })
    .eq("id", noteId)
    .select("id, diary_quarter_id, month_name, date, emoji, tags, content")
    .single();

  if (error) throw new DiaryRepoError(error.message);
  return mapDiaryNoteRowToUi(data as DiaryNoteRow);
}

export async function deleteDiaryNote(noteId: string): Promise<void> {
  await getUserId();

  const { error } = await supabase.from("diary_notes").delete().eq("id", noteId);
  if (error) throw new DiaryRepoError(error.message);
}

export async function upsertQuarterReflection(
  diaryQuarterId: string,
  payload: { emoji?: QuarterReflection["emoji"]; content: string }
): Promise<QuarterReflectionRow> {
  await getUserId();

  const { data: existing, error: existingError } = await supabase
    .from("quarter_reflections")
    .select("id")
    .eq("diary_quarter_id", diaryQuarterId)
    .maybeSingle();

  if (existingError) throw new DiaryRepoError(existingError.message);

  if (existing?.id) {
    const { data, error } = await supabase
      .from("quarter_reflections")
      .update({ emoji: payload.emoji ?? null, content: payload.content })
      .eq("id", existing.id)
      .select("id, diary_quarter_id, emoji, content, created_at")
      .single();

    if (error) throw new DiaryRepoError(error.message);
    return data as QuarterReflectionRow;
  }

  const { data, error } = await supabase
    .from("quarter_reflections")
    .insert({
      diary_quarter_id: diaryQuarterId,
      emoji: payload.emoji ?? null,
      content: payload.content,
    })
    .select("id, diary_quarter_id, emoji, content, created_at")
    .single();

  if (error) throw new DiaryRepoError(error.message);
  return data as QuarterReflectionRow;
}

export async function getDiaryQuarterBundle(params: {
  year: number;
  quarter: 1 | 2 | 3 | 4;
  isLocked: boolean;
}): Promise<{ diaryQuarterId: string; notesData: NotesData }> {
  const { diaryQuarterId } = await ensureDiaryQuarter(params.year, params.quarter);

  const months = getQuarterMonths(params.quarter);
  const rows = await listDiaryNotes(diaryQuarterId);

  const notesByMonth = new Map<string, Note[]>();
  for (const r of rows) {
    const arr = notesByMonth.get(r.month_name) ?? [];
    arr.push(mapDiaryNoteRowToUi(r));
    notesByMonth.set(r.month_name, arr);
  }

  const { data: reflectionRow, error: reflectionError } = await supabase
    .from("quarter_reflections")
    .select("id, diary_quarter_id, emoji, content, created_at")
    .eq("diary_quarter_id", diaryQuarterId)
    .maybeSingle();

  if (reflectionError) throw new DiaryRepoError(reflectionError.message);

  return {
    diaryQuarterId,
    notesData: {
      id: diaryQuarterId,
      year: params.year,
      quarter: params.quarter,
      monthlyNotes: [
        { month: months[0], notes: notesByMonth.get(months[0]) ?? [] },
        { month: months[1], notes: notesByMonth.get(months[1]) ?? [] },
        { month: months[2], notes: notesByMonth.get(months[2]) ?? [] },
      ] as [MonthNotes, MonthNotes, MonthNotes],
      quarterReflection: reflectionRow
        ? mapReflectionRowToUi(reflectionRow as QuarterReflectionRow, params.year, params.quarter, params.isLocked)
        : undefined,
    },
  };
}

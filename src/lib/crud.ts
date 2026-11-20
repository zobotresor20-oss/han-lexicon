// han-Lexicon — CRUD operations for word entries, sub-elements, examples.
// All operations go through Dexie (IndexedDB). Client-side only.

import { getDb } from "./db";
import { initialSrsState, reviewSrs, qualityFromUi } from "./sm2";
import { uid, localDateKey, validateEntry } from "./utils-han";
import type {
  WordEntry,
  Chunk,
  Collocation,
  Idiom,
  ExampleSentence,
  PartOfSpeech,
  ReviewLog,
  Quality,
  EntryStatus,
} from "./types";

// ---------------------------------------------------------------------------
// Word entries
// ---------------------------------------------------------------------------
export interface NewWordInput {
  korean: string;
  english: string;
  romanization?: string;
  ipa?: string;
  partOfSpeech: PartOfSpeech;
  usageContext?: string;
  notes?: string;
  tags?: string[];
}

export async function createWord(input: NewWordInput): Promise<string> {
  const db = getDb();
  const now = Date.now();
  const id = uid("w_");
  const entry: WordEntry = {
    id,
    korean: input.korean.trim(),
    english: input.english.trim(),
    romanization: input.romanization?.trim() || undefined,
    ipa: input.ipa?.trim() || undefined,
    partOfSpeech: input.partOfSpeech,
    usageContext: input.usageContext?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    tags: (input.tags ?? []).map((t) => t.trim()).filter(Boolean),
    chunks: [],
    collocations: [],
    idioms: [],
    examples: [],
    srs: initialSrsState(),
    status: "incomplete",
    createdAt: now,
    updatedAt: now,
  };
  const report = validateEntry(entry);
  entry.status = report.status;
  await db.words.add(entry);
  await bumpDailyStat({ newWordsDelta: 1 });
  return id;
}

export async function updateWord(
  id: string,
  patch: Partial<NewWordInput>
): Promise<void> {
  const db = getDb();
  const existing = await db.words.get(id);
  if (!existing) return;
  const next: WordEntry = {
    ...existing,
    ...patch,
    korean: (patch.korean ?? existing.korean).trim(),
    english: (patch.english ?? existing.english).trim(),
    romanization: (patch.romanization ?? existing.romanization)?.trim() || undefined,
    ipa: (patch.ipa ?? existing.ipa)?.trim() || undefined,
    usageContext: (patch.usageContext ?? existing.usageContext)?.trim() || undefined,
    notes: (patch.notes ?? existing.notes)?.trim() || undefined,
    tags: (patch.tags ?? existing.tags ?? []).map((t) => t.trim()).filter(Boolean),
    updatedAt: Date.now(),
  };
  const report = validateEntry(next);
  // Preserve learning/mastered flags once earned; the validator will keep
  // them only if structural minimums are met.
  next.status = report.status;
  await db.words.put(next);
}

export async function deleteWord(id: string): Promise<void> {
  const db = getDb();
  await db.words.delete(id);
  // Cascade delete related review logs
  await db.reviewLogs.where("itemId").equals(id).delete();
}

export async function getWord(id: string): Promise<WordEntry | undefined> {
  const db = getDb();
  return db.words.get(id);
}

export async function getAllWords(): Promise<WordEntry[]> {
  const db = getDb();
  return db.words.toArray();
}

// ---------------------------------------------------------------------------
// Sub-elements (chunks, collocations, idioms) share the same shape
// ---------------------------------------------------------------------------
interface NewSubInput {
  korean: string;
  english: string;
  ipa?: string;
}

async function addSubElement<K extends "chunks" | "collocations" | "idioms">(
  wordId: string,
  key: K,
  input: NewSubInput
): Promise<string> {
  const db = getDb();
  const word = await db.words.get(wordId);
  if (!word) throw new Error("Word not found");
  if (!input.english.trim()) {
    throw new Error("English translation is required.");
  }
  const now = Date.now();
  const subId = uid(key === "chunks" ? "c_" : key === "collocations" ? "co_" : "id_");
  const sub = {
    id: subId,
    wordId,
    korean: input.korean.trim(),
    english: input.english.trim(),
    ipa: input.ipa?.trim() || undefined,
    examples: [] as ExampleSentence[],
    createdAt: now,
    updatedAt: now,
  };
  (word[key] as typeof sub[]).push(sub);
  const report = validateEntry(word);
  word.status = report.status;
  word.updatedAt = now;
  await db.words.put(word);
  return subId;
}

async function updateSubElement<K extends "chunks" | "collocations" | "idioms">(
  wordId: string,
  key: K,
  subId: string,
  patch: Partial<NewSubInput>
): Promise<void> {
  const db = getDb();
  const word = await db.words.get(wordId);
  if (!word) return;
  const arr = word[key] as (Chunk | Collocation | Idiom)[];
  const idx = arr.findIndex((x) => x.id === subId);
  if (idx < 0) return;
  arr[idx] = {
    ...arr[idx],
    ...patch,
    korean: (patch.korean ?? arr[idx].korean).trim(),
    english: (patch.english ?? arr[idx].english).trim(),
    ipa: (patch.ipa ?? arr[idx].ipa)?.trim() || undefined,
    updatedAt: Date.now(),
  } as Chunk | Collocation | Idiom;
  const report = validateEntry(word);
  word.status = report.status;
  word.updatedAt = Date.now();
  await db.words.put(word);
}

async function deleteSubElement<K extends "chunks" | "collocations" | "idioms">(
  wordId: string,
  key: K,
  subId: string
): Promise<void> {
  const db = getDb();
  const word = await db.words.get(wordId);
  if (!word) return;
  const arr = word[key] as (Chunk | Collocation | Idiom)[];
  const idx = arr.findIndex((x) => x.id === subId);
  if (idx < 0) return;
  arr.splice(idx, 1);
  const report = validateEntry(word);
  word.status = report.status;
  word.updatedAt = Date.now();
  await db.words.put(word);
}

// Public API
export const addChunk = (wordId: string, input: NewSubInput) =>
  addSubElement(wordId, "chunks", input);
export const updateChunk = (wordId: string, subId: string, patch: Partial<NewSubInput>) =>
  updateSubElement(wordId, "chunks", subId, patch);
export const deleteChunk = (wordId: string, subId: string) =>
  deleteSubElement(wordId, "chunks", subId);

export const addCollocation = (wordId: string, input: NewSubInput) =>
  addSubElement(wordId, "collocations", input);
export const updateCollocation = (wordId: string, subId: string, patch: Partial<NewSubInput>) =>
  updateSubElement(wordId, "collocations", subId, patch);
export const deleteCollocation = (wordId: string, subId: string) =>
  deleteSubElement(wordId, "collocations", subId);

export const addIdiom = (wordId: string, input: NewSubInput) =>
  addSubElement(wordId, "idioms", input);
export const updateIdiom = (wordId: string, subId: string, patch: Partial<NewSubInput>) =>
  updateSubElement(wordId, "idioms", subId, patch);
export const deleteIdiom = (wordId: string, subId: string) =>
  deleteSubElement(wordId, "idioms", subId);

// ---------------------------------------------------------------------------
// Example sentences
// ---------------------------------------------------------------------------
export interface NewExampleInput {
  korean: string;
  english: string;
  ipa?: string;
  note?: string;
  parentType: "word" | "chunk" | "collocation" | "idiom";
  parentId: string;
}

export async function addExample(
  wordId: string,
  input: NewExampleInput
): Promise<string> {
  const db = getDb();
  const word = await db.words.get(wordId);
  if (!word) throw new Error("Word not found");
  if (!input.english.trim()) {
    throw new Error("English translation is required.");
  }
  const now = Date.now();
  const exId = uid("ex_");
  const example: ExampleSentence = {
    id: exId,
    korean: input.korean.trim(),
    english: input.english.trim(),
    ipa: input.ipa?.trim() || undefined,
    note: input.note?.trim() || undefined,
    parentId: input.parentId,
    parentType: input.parentType,
    createdAt: now,
    updatedAt: now,
  };

  if (input.parentType === "word") {
    word.examples.push(example);
  } else {
    const arr =
      input.parentType === "chunk"
        ? word.chunks
        : input.parentType === "collocation"
          ? word.collocations
          : word.idioms;
    const parent = arr.find((x) => x.id === input.parentId);
    if (!parent) throw new Error("Parent element not found");
    parent.examples.push(example);
  }
  word.updatedAt = now;
  await db.words.put(word);
  return exId;
}

export async function updateExample(
  wordId: string,
  exampleId: string,
  patch: Partial<NewExampleInput>
): Promise<void> {
  const db = getDb();
  const word = await db.words.get(wordId);
  if (!word) return;
  const allExamples = collectAllExamples(word);
  const ex = allExamples.find((e) => e.id === exampleId);
  if (!ex) return;
  if (patch.korean !== undefined) ex.korean = patch.korean.trim();
  if (patch.english !== undefined) ex.english = patch.english.trim();
  if (patch.ipa !== undefined) ex.ipa = patch.ipa.trim() || undefined;
  if (patch.note !== undefined) ex.note = patch.note.trim() || undefined;
  ex.updatedAt = Date.now();
  word.updatedAt = Date.now();
  await db.words.put(word);
}

export async function deleteExample(
  wordId: string,
  exampleId: string
): Promise<void> {
  const db = getDb();
  const word = await db.words.get(wordId);
  if (!word) return;
  // Remove from word-level examples
  word.examples = word.examples.filter((e) => e.id !== exampleId);
  // Remove from sub-element examples
  for (const arr of [word.chunks, word.collocations, word.idioms]) {
    for (const sub of arr) {
      sub.examples = sub.examples.filter((e) => e.id !== exampleId);
    }
  }
  word.updatedAt = Date.now();
  await db.words.put(word);
}

// ---------------------------------------------------------------------------
// SRS review — applies to any item (word or sub-element identified by id).
// For simplicity we store SRS state at the word level only; sub-element
// reviews update the word's SRS state too. Review logs are stored separately.
// ---------------------------------------------------------------------------
export async function reviewItem(
  itemId: string,
  itemType: "word" | "chunk" | "collocation" | "idiom" | "example",
  knew: boolean,
  difficulty: "easy" | "normal" | "hard" = "normal"
): Promise<void> {
  const db = getDb();
  const word = await db.words.get(itemId);
  if (!word) return;
  const quality = qualityFromUi(knew, difficulty);
  const wasDue = word.srs.dueDate <= Date.now();
  word.srs = reviewSrs(word.srs, quality);
  // Promote to learning/mastered when appropriate
  if (word.srs.repetitions >= 4 && word.srs.interval >= 21) {
    word.status = "mastered" as EntryStatus;
  } else if (word.srs.repetitions >= 1) {
    // Only mark learning if structurally complete; otherwise keep incomplete
    const rep = validateEntry(word);
    if (rep.status !== "incomplete") word.status = "learning" as EntryStatus;
  }
  word.updatedAt = Date.now();
  await db.words.put(word);

  const log: ReviewLog = {
    id: uid("rl_"),
    itemId,
    itemType,
    quality: quality as Quality,
    reviewedAt: Date.now(),
    wasDue,
  };
  await db.reviewLogs.add(log);

  // Update daily stats
  await bumpDailyStat({
    reviewsDelta: 1,
    correctDelta: knew ? 1 : 0,
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function collectAllExamples(word: WordEntry): ExampleSentence[] {
  return [
    ...word.examples,
    ...word.chunks.flatMap((c) => c.examples),
    ...word.collocations.flatMap((c) => c.examples),
    ...word.idioms.flatMap((i) => i.examples),
  ];
}

// ---------------------------------------------------------------------------
// Daily stats updater — bump today's row
// ---------------------------------------------------------------------------
interface BumpOptions {
  newWordsDelta?: number;
  reviewsDelta?: number;
  correctDelta?: number;
  studyTimeMsDelta?: number;
  masteredAddedDelta?: number;
}

export async function bumpDailyStat(opts: BumpOptions): Promise<void> {
  const db = getDb();
  const date = localDateKey();
  const existing = await db.dailyStats.get(date);
  const next = {
    date,
    newWords: (existing?.newWords ?? 0) + (opts.newWordsDelta ?? 0),
    reviewsDone: (existing?.reviewsDone ?? 0) + (opts.reviewsDelta ?? 0),
    correctReviews: (existing?.correctReviews ?? 0) + (opts.correctDelta ?? 0),
    totalReviews: (existing?.totalReviews ?? 0) + (opts.reviewsDelta ?? 0),
    studyTimeMs: (existing?.studyTimeMs ?? 0) + (opts.studyTimeMsDelta ?? 0),
    masteredAdded: (existing?.masteredAdded ?? 0) + (opts.masteredAddedDelta ?? 0),
  };
  await db.dailyStats.put(next);
}

export async function addStudyTime(ms: number): Promise<void> {
  if (ms <= 0) return;
  await bumpDailyStat({ studyTimeMsDelta: ms });
}

// ---------------------------------------------------------------------------
// Search history
// ---------------------------------------------------------------------------
export async function logSearch(
  query: string,
  direction: "ko-en" | "en-ko",
  resultCount: number
): Promise<void> {
  const db = getDb();
  const trimmed = query.trim();
  if (!trimmed) return;
  await db.searchHistory.add({
    id: uid("sh_"),
    query: trimmed,
    direction,
    resultCount,
    searchedAt: Date.now(),
  });
  // Keep only the 50 most recent
  const all = await db.searchHistory.orderBy("searchedAt").reverse().toArray();
  if (all.length > 50) {
    const toDelete = all.slice(50);
    await db.searchHistory.bulkDelete(toDelete.map((s) => s.id));
  }
}

export async function clearSearchHistory(): Promise<void> {
  const db = getDb();
  await db.searchHistory.clear();
}

// ---------------------------------------------------------------------------
// Bulk operations used by backup/restore
// ---------------------------------------------------------------------------
export async function bulkPutWords(words: WordEntry[]): Promise<void> {
  const db = getDb();
  await db.words.bulkPut(words);
}

export async function bulkPutReviewLogs(logs: ReviewLog[]): Promise<void> {
  const db = getDb();
  await db.reviewLogs.bulkPut(logs);
}

export async function bulkPutDailyStats(stats: import("./types").DailyStat[]): Promise<void> {
  const db = getDb();
  await db.dailyStats.bulkPut(stats);
}

export async function clearAllData(): Promise<void> {
  const db = getDb();
  await db.words.clear();
  await db.reviewLogs.clear();
  await db.dailyStats.clear();
  await db.searchHistory.clear();
}

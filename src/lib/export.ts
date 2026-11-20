// han-Lexicon — Backup, restore, and CSV export.
// All client-side. Uses Blob + URL.createObjectURL for downloads.

import { getDb } from "./db";
import { bulkPutWords, bulkPutReviewLogs, bulkPutDailyStats, clearAllData } from "./crud";
import { DEFAULT_SETTINGS } from "./types";
import { validateEntry } from "./utils-han";
import type { BackupEnvelope, WordEntry, Settings } from "./types";

// ---------------------------------------------------------------------------
// JSON backup
// ---------------------------------------------------------------------------
export async function exportJsonBackup(settings: Settings): Promise<void> {
  const db = getDb();
  const [words, reviewLogs, dailyStats, searchHistory] = await Promise.all([
    db.words.toArray(),
    db.reviewLogs.toArray(),
    db.dailyStats.toArray(),
    db.searchHistory.toArray(),
  ]);
  const envelope: BackupEnvelope = {
    app: "han-Lexicon",
    version: 1,
    exportedAt: Date.now(),
    words,
    reviewLogs,
    dailyStats,
    settings,
    searchHistory,
  };
  const blob = new Blob([JSON.stringify(envelope, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const date = new Date().toISOString().slice(0, 10);
  a.download = `han-lexicon-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------------------------------------------------------------------
// Restore
// ---------------------------------------------------------------------------
export interface ValidationResult {
  ok: boolean;
  errors: string[];
  counts?: {
    words: number;
    reviewLogs: number;
    dailyStats: number;
    searchHistory: number;
  };
}

export function validateBackup(text: string): ValidationResult {
  const errors: string[] = [];
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return { ok: false, errors: ["File is not valid JSON."] };
  }
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, errors: ["JSON root is not an object."] };
  }
  if (parsed.app !== "han-Lexicon") {
    errors.push(`Missing or wrong "app" field (expected "han-Lexicon").`);
  }
  if (!Array.isArray(parsed.words)) {
    errors.push(`"words" must be an array.`);
  }
  if (parsed.reviewLogs !== undefined && !Array.isArray(parsed.reviewLogs)) {
    errors.push(`"reviewLogs" must be an array when present.`);
  }
  if (parsed.dailyStats !== undefined && !Array.isArray(parsed.dailyStats)) {
    errors.push(`"dailyStats" must be an array when present.`);
  }
  if (parsed.searchHistory !== undefined && !Array.isArray(parsed.searchHistory)) {
    errors.push(`"searchHistory" must be an array when present.`);
  }
  // Spot-check first word shape
  if (Array.isArray(parsed.words) && parsed.words.length > 0) {
    const w = parsed.words[0];
    if (!w || typeof w.korean !== "string" || typeof w.english !== "string" || typeof w.id !== "string") {
      errors.push(`Word shape is invalid (missing id, korean or english).`);
    }
  }
  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    errors: [],
    counts: {
      words: parsed.words.length,
      reviewLogs: parsed.reviewLogs?.length ?? 0,
      dailyStats: parsed.dailyStats?.length ?? 0,
      searchHistory: parsed.searchHistory?.length ?? 0,
    },
  };
}

export async function restoreJsonBackup(text: string): Promise<ValidationResult> {
  const validation = validateBackup(text);
  if (!validation.ok) return validation;
  const parsed: BackupEnvelope = JSON.parse(text);
  // Wipe current data before restoring
  await clearAllData();
  await bulkPutWords(parsed.words as WordEntry[]);
  if (parsed.reviewLogs) await bulkPutReviewLogs(parsed.reviewLogs);
  if (parsed.dailyStats) await bulkPutDailyStats(parsed.dailyStats);
  if (parsed.searchHistory) {
    const db = getDb();
    await db.searchHistory.bulkPut(parsed.searchHistory);
  }
  return validation;
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------
function csvEscape(value: string | undefined | null): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function exportCsv(): Promise<void> {
  const db = getDb();
  const words = await db.words.toArray();

  const headers = [
    "id",
    "korean",
    "english",
    "romanization",
    "ipa",
    "partOfSpeech",
    "usageContext",
    "notes",
    "tags",
    "status",
    "createdAt",
    "updatedAt",
    "chunks",
    "collocations",
    "idioms",
    "examples",
  ];

  const rows: string[] = [];
  rows.push(headers.join(","));

  for (const w of words) {
    const report = validateEntry(w);
    const chunksStr = w.chunks
      .map((c) => `${c.korean} = ${c.english}${c.ipa ? ` /${c.ipa}/` : ""}`)
      .join(" | ");
    const collocationsStr = w.collocations
      .map((c) => `${c.korean} = ${c.english}`)
      .join(" | ");
    const idiomsStr = w.idioms
      .map((i) => `${i.korean} = ${i.english}`)
      .join(" | ");
    const examplesStr = [
      ...w.examples,
      ...w.chunks.flatMap((c) => c.examples),
      ...w.collocations.flatMap((c) => c.examples),
      ...w.idioms.flatMap((i) => i.examples),
    ]
      .map((e) => `${e.korean} = ${e.english}`)
      .join(" | ");

    const row = [
      w.id,
      w.korean,
      w.english,
      w.romanization ?? "",
      w.ipa ?? "",
      w.partOfSpeech,
      w.usageContext ?? "",
      w.notes ?? "",
      w.tags.join(";"),
      report.status,
      new Date(w.createdAt).toISOString(),
      new Date(w.updatedAt).toISOString(),
      chunksStr,
      collocationsStr,
      idiomsStr,
      examplesStr,
    ]
      .map(csvEscape)
      .join(",");
    rows.push(row);
  }

  const blob = new Blob(["\uFEFF" + rows.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const date = new Date().toISOString().slice(0, 10);
  a.download = `han-lexicon-dictionary-${date}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

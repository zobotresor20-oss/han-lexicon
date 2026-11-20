// han-Lexicon — small utilities: ID generation, date formatting, validation.

import {
  MIN_CHUNKS,
  MIN_COLLOCATIONS,
  MIN_IDIOMS,
  type WordEntry,
  type ValidationReport,
  type EntryStatus,
} from "./types";

// Generate a reasonably unique id without external dependencies.
export function uid(prefix = ""): string {
  const rnd = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}${time}${rnd}`;
}

// YYYY-MM-DD in the user's local timezone
export function localDateKey(ts: number = Date.now()): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfDayTs(ts: number = Date.now()): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function formatDuration(ms: number): string {
  if (ms <= 0) return "0m";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return formatDate(ts);
}

// Validation
export function validateEntry(entry: WordEntry): ValidationReport {
  const missingChunks = Math.max(0, MIN_CHUNKS - entry.chunks.length);
  const missingCollocations = Math.max(0, MIN_COLLOCATIONS - entry.collocations.length);
  const missingIdioms = Math.max(0, MIN_IDIOMS - entry.idioms.length);

  // Explicit user-flagged statuses take precedence when the structural
  // minimums are met; otherwise we fall back to "incomplete".
  let status: EntryStatus;
  const structurallyComplete =
    missingChunks === 0 && missingCollocations === 0 && missingIdioms === 0;

  if (!structurallyComplete) {
    status = "incomplete";
  } else if (entry.status === "incomplete") {
    // Structural minimums met but never reviewed yet
    status = "complete";
  } else {
    // keep learning / mastered once earned
    status = entry.status;
  }

  const parts: string[] = [];
  if (missingChunks > 0)
    parts.push(`${missingChunks} chunk${missingChunks > 1 ? "s" : ""} missing`);
  if (missingCollocations > 0)
    parts.push(
      `${missingCollocations} collocation${missingCollocations > 1 ? "s" : ""} missing`
    );
  if (missingIdioms > 0)
    parts.push(`${missingIdioms} idiom${missingIdioms > 1 ? "s" : ""} missing`);

  const message =
    parts.length === 0
      ? status === "mastered"
        ? "Mastered"
        : status === "learning"
          ? "Learning"
          : "Complete"
      : `Incomplete — ${parts.join(", ")}.`;

  return {
    status,
    missingChunks,
    missingCollocations,
    missingIdioms,
    message,
  };
}

export function statusColor(status: EntryStatus): string {
  switch (status) {
    case "mastered": return "text-emerald-600 dark:text-emerald-400";
    case "learning": return "text-amber-600 dark:text-amber-400";
    case "complete": return "text-sky-600 dark:text-sky-400";
    case "incomplete": return "text-rose-600 dark:text-rose-400";
  }
}

export function statusBg(status: EntryStatus): string {
  switch (status) {
    case "mastered": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
    case "learning": return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
    case "complete": return "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300";
    case "incomplete": return "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300";
  }
}

// Normalize a string for searching: trim, collapse whitespace, lowercase,
// strip punctuation. For Korean we also keep Jamo composed.
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFC")
    .replace(/[!-/:-@\[-`{-~\u3000-\u303f\uff01-\uff60\u2026.,;:!?'"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Build a search index string for an entry (korean + english + all sub-elements)
export function entrySearchBlob(entry: WordEntry): string {
  const parts: string[] = [
    entry.korean,
    entry.english,
    entry.romanization ?? "",
    entry.ipa ?? "",
    entry.usageContext ?? "",
    entry.notes ?? "",
    ...entry.tags,
  ];
  for (const c of entry.chunks) {
    parts.push(c.korean, c.english, c.ipa ?? "");
    for (const e of c.examples) parts.push(e.korean, e.english);
  }
  for (const c of entry.collocations) {
    parts.push(c.korean, c.english, c.ipa ?? "");
    for (const e of c.examples) parts.push(e.korean, e.english);
  }
  for (const i of entry.idioms) {
    parts.push(i.korean, i.english, i.ipa ?? "");
    for (const e of i.examples) parts.push(e.korean, e.english);
  }
  for (const e of entry.examples) parts.push(e.korean, e.english);
  return parts.join(" ");
}

// Clamp helper
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

// Shuffle (Fisher-Yates) — returns a new array
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pick n random items
export function sampleN<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

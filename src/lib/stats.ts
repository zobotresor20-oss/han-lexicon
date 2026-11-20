// han-Lexicon — statistics aggregator (computed from IndexedDB).

import { getDb } from "./db";
import { srsBucket } from "./sm2";
import { validateEntry, localDateKey, startOfDayTs } from "./utils-han";
import type { WordEntry, DailyStat } from "./types";

export interface DashboardStats {
  totalEntries: number;
  completeEntries: number;
  incompleteEntries: number;
  learningEntries: number;
  masteredEntries: number;
  itemsWithoutPronunciation: number;
  overallAccuracy: number; // 0..1
  totalStudyTimeMs: number;
  currentStreak: number;
  longestStreak: number;
  dailyNewWordsProgress: number; // today's new words vs goal
  dailyReviewsProgress: number; // today's reviews vs goal
  dailyNewWordsGoal: number;
  dailyReviewsGoal: number;
  dueToday: number;
  upcoming: number;
  missed: number;
}

export async function computeDashboard(
  dailyNewWordsGoal: number,
  dailyReviewsGoal: number
): Promise<DashboardStats> {
  const db = getDb();
  const words = await db.words.toArray();
  const dailyStats = await db.dailyStats.toArray();
  const reviewLogs = await db.reviewLogs.toArray();

  const total = words.length;
  let complete = 0;
  let incomplete = 0;
  let learning = 0;
  let mastered = 0;
  let itemsWithoutPronunciation = 0;
  let dueToday = 0;
  let upcoming = 0;
  let missed = 0;
  const now = Date.now();

  for (const w of words) {
    const rep = validateEntry(w);
    if (rep.status === "incomplete") incomplete++;
    else if (rep.status === "complete") complete++;
    else if (rep.status === "learning") learning++;
    else if (rep.status === "mastered") mastered++;

    if (!w.ipa) itemsWithoutPronunciation++;
    // Also count sub-elements without IPA
    for (const c of w.chunks) if (!c.ipa) itemsWithoutPronunciation++;
    for (const c of w.collocations) if (!c.ipa) itemsWithoutPronunciation++;
    for (const i of w.idioms) if (!i.ipa) itemsWithoutPronunciation++;
    for (const e of w.examples) if (!e.ipa) itemsWithoutPronunciation++;
    for (const c of w.chunks) for (const e of c.examples) if (!e.ipa) itemsWithoutPronunciation++;
    for (const c of w.collocations) for (const e of c.examples) if (!e.ipa) itemsWithoutPronunciation++;
    for (const i of w.idioms) for (const e of i.examples) if (!e.ipa) itemsWithoutPronunciation++;

    const bucket = srsBucket(w.srs, now);
    if (bucket === "due") dueToday++;
    else if (bucket === "upcoming") upcoming++;
    else if (bucket === "missed") missed++;
  }

  const totalReviews = reviewLogs.length;
  const correctReviews = reviewLogs.filter((r) => r.quality >= 3).length;
  const overallAccuracy = totalReviews > 0 ? correctReviews / totalReviews : 0;

  const totalStudyTimeMs = dailyStats.reduce((s, d) => s + d.studyTimeMs, 0);

  // Streaks
  const { currentStreak, longestStreak } = computeStreaks(dailyStats);

  const today = localDateKey();
  const todayStat = dailyStats.find((d) => d.date === today);
  const todayNew = todayStat?.newWords ?? 0;
  const todayReviews = todayStat?.reviewsDone ?? 0;

  return {
    totalEntries: total,
    completeEntries: complete,
    incompleteEntries: incomplete,
    learningEntries: learning,
    masteredEntries: mastered,
    itemsWithoutPronunciation,
    overallAccuracy,
    totalStudyTimeMs,
    currentStreak,
    longestStreak,
    dailyNewWordsProgress: todayNew,
    dailyReviewsProgress: todayReviews,
    dailyNewWordsGoal,
    dailyReviewsGoal,
    dueToday,
    upcoming,
    missed,
  };
}

export function computeStreaks(dailyStats: DailyStat[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (dailyStats.length === 0) return { currentStreak: 0, longestStreak: 0 };
  // A day is "active" if reviewsDone > 0 OR newWords > 0 OR studyTimeMs > 0
  const active = new Set(
    dailyStats
      .filter((d) => d.reviewsDone > 0 || d.newWords > 0 || d.studyTimeMs > 0)
      .map((d) => d.date)
  );

  // Build a sorted list of dates from today backwards
  const today = startOfDayTs();
  let currentStreak = 0;
  for (let i = 0; i < 3650; i++) {
    const ts = today - i * 24 * 60 * 60 * 1000;
    const key = localDateKey(ts);
    if (active.has(key)) currentStreak++;
    else break;
  }

  // Longest streak: walk through all active dates sorted asc, count consecutive
  const sorted = [...active].sort();
  let longest = 0;
  let run = 0;
  let prevTs: number | null = null;
  for (const key of sorted) {
    const ts = startOfDayTs(new Date(key + "T00:00:00").getTime());
    if (prevTs !== null) {
      const diffDays = Math.round((ts - prevTs) / (24 * 60 * 60 * 1000));
      if (diffDays === 1) {
        run++;
      } else {
        run = 1;
      }
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prevTs = ts;
  }
  return { currentStreak, longestStreak: longest };
}

// Get all daily stats sorted ascending by date (for charts)
export async function getAllDailyStats(): Promise<DailyStat[]> {
  const db = getDb();
  const all = await db.dailyStats.toArray();
  return all.sort((a, b) => a.date.localeCompare(b.date));
}

// Build a vocabulary-growth series: cumulative words created over time.
export async function getVocabularyGrowth(): Promise<{ date: string; total: number }[]> {
  const db = getDb();
  const words = await db.words.toArray();
  const byDay = new Map<string, number>();
  for (const w of words) {
    const key = localDateKey(w.createdAt);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  const keys = [...byDay.keys()].sort();
  let cumulative = 0;
  return keys.map((k) => {
    cumulative += byDay.get(k) ?? 0;
    return { date: k, total: cumulative };
  });
}

// Mastered vocabulary growth: cumulative words that became mastered.
// We approximate by scanning reviewLogs: when a word's repetitions first hit 4
// we treat that review as the "mastered" event.
export async function getMasteredGrowth(): Promise<{ date: string; total: number }[]> {
  const db = getDb();
  const words = await db.words.toArray();
  const logs = await db.reviewLogs.orderBy("reviewedAt").toArray();
  // Per-word counters
  const reps = new Map<string, number>();
  const masteredAt = new Map<string, number>();
  for (const log of logs) {
    const prev = reps.get(log.itemId) ?? 0;
    const next = prev + (log.quality >= 3 ? 1 : 0);
    reps.set(log.itemId, next);
    if (next >= 4 && !masteredAt.has(log.itemId)) {
      masteredAt.set(log.itemId, log.reviewedAt);
    }
  }
  // Also count words seeded as mastered in demo data (none, but keep generic)
  for (const w of words) {
    if (w.status === "mastered" && !masteredAt.has(w.id)) {
      masteredAt.set(w.id, w.updatedAt);
    }
  }
  const byDay = new Map<string, number>();
  for (const ts of masteredAt.values()) {
    const key = localDateKey(ts);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  const keys = [...byDay.keys()].sort();
  let cumulative = 0;
  return keys.map((k) => {
    cumulative += byDay.get(k) ?? 0;
    return { date: k, total: cumulative };
  });
}

// Accuracy over time: per-day correct/total
export async function getAccuracyOverTime(): Promise<{ date: string; accuracy: number }[]> {
  const db = getDb();
  const logs = await db.reviewLogs.toArray();
  const byDay = new Map<string, { correct: number; total: number }>();
  for (const log of logs) {
    const key = localDateKey(log.reviewedAt);
    const cur = byDay.get(key) ?? { correct: 0, total: 0 };
    cur.total++;
    if (log.quality >= 3) cur.correct++;
    byDay.set(key, cur);
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => ({
      date,
      accuracy: v.total > 0 ? v.correct / v.total : 0,
    }));
}

export async function getWordOfTheDay(): Promise<WordEntry | null> {
  const db = getDb();
  const count = await db.words.count();
  if (count === 0) return null;
  // Deterministic per-day pick so it doesn't change on every render
  const today = localDateKey();
  const seed = [...today].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const offset = seed % count;
  const all = await db.words.toArray();
  return all[offset] ?? null;
}

export async function getReviewQueue(): Promise<WordEntry[]> {
  const db = getDb();
  const now = Date.now();
  const due = await db.words.where("srs.dueDate").belowOrEqual(now).toArray();
  return due;
}

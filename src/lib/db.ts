// han-Lexicon — Dexie (IndexedDB) database setup
// All client-side only. Must be imported from client components only.

import Dexie, { type Table } from "dexie";
import type {
  WordEntry,
  ReviewLog,
  DailyStat,
  SearchHistoryEntry,
} from "./types";

export class HanLexiconDB extends Dexie {
  words!: Table<WordEntry, string>;
  reviewLogs!: Table<ReviewLog, string>;
  dailyStats!: Table<DailyStat, string>;
  searchHistory!: Table<SearchHistoryEntry, string>;

  constructor() {
    super("han-lexicon-db");
    this.version(1).stores({
      // Inline arrays (chunks, collocations, idioms, examples) are not indexed;
      // we only index the fields we actually query on.
      words: "id, korean, english, status, createdAt, updatedAt, *tags, srs.dueDate",
      reviewLogs: "id, itemId, itemType, reviewedAt",
      dailyStats: "date",
      searchHistory: "id, searchedAt",
    });
  }
}

// Lazy singleton — only created in the browser
let _db: HanLexiconDB | null = null;

export function getDb(): HanLexiconDB {
  if (typeof window === "undefined") {
    throw new Error("Dexie database can only be used in the browser.");
  }
  if (!_db) {
    _db = new HanLexiconDB();
  }
  return _db;
}

// Safe accessor for components that may run on server during hydration
// Returns null on the server.
export function getDbSafe(): HanLexiconDB | null {
  if (typeof window === "undefined") return null;
  return getDb();
}

// han-Lexicon — TypeScript domain types
// All data lives in IndexedDB via Dexie. No backend, no remote sync.

export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "particle"
  | "conjunction"
  | "interjection"
  | "expression"
  | "pronoun"
  | "number"
  | "counter"
  | "determiner"
  | "other";

export const ALL_PARTS_OF_SPEECH: PartOfSpeech[] = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "particle",
  "conjunction",
  "interjection",
  "expression",
  "pronoun",
  "number",
  "counter",
  "determiner",
  "other",
];

export type EntryStatus = "incomplete" | "complete" | "learning" | "mastered";

export type ElementType = "word" | "chunk" | "collocation" | "idiom" | "example";

// ---------------------------------------------------------------------------
// Example sentence — attached to a word, chunk, collocation or idiom.
// ---------------------------------------------------------------------------
export interface ExampleSentence {
  id: string;
  korean: string;
  english: string; // obligatory
  ipa?: string; // optional
  note?: string; // optional personal note
  // Reference to the parent element
  parentId: string; // word id, or sub-element id
  parentType: "word" | "chunk" | "collocation" | "idiom";
  createdAt: number;
  updatedAt: number;
}

// ---------------------------------------------------------------------------
// Sub-elements of a word entry
// ---------------------------------------------------------------------------
export interface Chunk {
  id: string;
  wordId: string;
  korean: string;
  english: string; // obligatory
  ipa?: string;
  examples: ExampleSentence[];
  createdAt: number;
  updatedAt: number;
}

export interface Collocation {
  id: string;
  wordId: string;
  korean: string;
  english: string; // obligatory
  ipa?: string;
  examples: ExampleSentence[];
  createdAt: number;
  updatedAt: number;
}

export interface Idiom {
  id: string;
  wordId: string;
  korean: string;
  english: string; // obligatory
  ipa?: string;
  examples: ExampleSentence[];
  createdAt: number;
  updatedAt: number;
}

// ---------------------------------------------------------------------------
// Word entry — the main lexical card
// ---------------------------------------------------------------------------
export interface WordEntry {
  id: string;
  korean: string;
  english: string; // obligatory
  romanization?: string;
  ipa?: string;
  partOfSpeech: PartOfSpeech;
  usageContext?: string;
  notes?: string;
  tags: string[];
  // Sub-elements stored inline for simpler IndexedDB queries and export.
  chunks: Chunk[];
  collocations: Collocation[];
  idioms: Idiom[];
  examples: ExampleSentence[]; // examples attached directly to the word
  // Spaced repetition state (SM-2)
  srs: SrsState;
  status: EntryStatus;
  createdAt: number;
  updatedAt: number;
}

// ---------------------------------------------------------------------------
// SM-2 spaced repetition state for any reviewable item (word or sub-element).
// ---------------------------------------------------------------------------
export interface SrsState {
  // SM-2 algorithm values
  easeFactor: number; // starts at 2.5
  interval: number; // days until next review
  repetitions: number; // consecutive correct reviews
  dueDate: number; // epoch ms when next due
  lastReviewDate?: number;
  // Statistics
  totalReviews: number;
  correctReviews: number;
  missedReviews: number;
  lastQuality?: Quality; // 0-5
}

export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

// ---------------------------------------------------------------------------
// Review log — kept for history & statistics
// ---------------------------------------------------------------------------
export interface ReviewLog {
  id: string;
  itemId: string;
  itemType: ElementType;
  quality: Quality;
  reviewedAt: number; // epoch ms
  wasDue: boolean;
}

// ---------------------------------------------------------------------------
// Search history
// ---------------------------------------------------------------------------
export interface SearchHistoryEntry {
  id: string;
  query: string;
  direction: "ko-en" | "en-ko";
  resultCount: number;
  searchedAt: number;
}

// ---------------------------------------------------------------------------
// Settings (persisted to localStorage via Zustand persist)
// ---------------------------------------------------------------------------
export interface Settings {
  theme: "light" | "dark" | "system";
  fontScale: "sm" | "md" | "lg" | "xl";
  hidePronunciationDuringExercises: boolean;
  preferKoreanNativeVoice: boolean;
  speechRate: number; // 0.5 - 1.5
  dailyNewWordsGoal: number;
  dailyReviewsGoal: number;
  reminderEnabled: boolean;
  reminderHour: number; // 0-23
  reminderMinute: number; // 0-59
  demoDataSeeded: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  fontScale: "md",
  hidePronunciationDuringExercises: true,
  preferKoreanNativeVoice: true,
  speechRate: 0.9,
  dailyNewWordsGoal: 3,
  dailyReviewsGoal: 15,
  reminderEnabled: false,
  reminderHour: 20,
  reminderMinute: 0,
  demoDataSeeded: false,
};

// ---------------------------------------------------------------------------
// Statistics snapshot — one row per day, stored for charts
// ---------------------------------------------------------------------------
export interface DailyStat {
  date: string; // YYYY-MM-DD (local)
  newWords: number;
  reviewsDone: number;
  correctReviews: number;
  totalReviews: number;
  studyTimeMs: number;
  masteredAdded: number;
}

// ---------------------------------------------------------------------------
// Study session configuration
// ---------------------------------------------------------------------------
export type ExerciseType =
  | "flashcards"
  | "free-recall"
  | "fill-blanks"
  | "complete-collocation"
  | "unscramble-chunks"
  | "idiom-quiz"
  | "word-matching"
  | "dictation"
  | "personal-production"
  | "daily-mini-text";

export interface SessionConfig {
  exerciseType: ExerciseType;
  questionCount: number;
  wordIds: string[]; // empty = all eligible words
  difficulty: "easy" | "normal" | "hard";
  hideIpa: boolean;
  mode: "normal" | "mistakes";
}

// ---------------------------------------------------------------------------
// Backup envelope — JSON file format
// ---------------------------------------------------------------------------
export interface BackupEnvelope {
  app: "han-Lexicon";
  version: 1;
  exportedAt: number;
  words: WordEntry[];
  reviewLogs: ReviewLog[];
  dailyStats: DailyStat[];
  settings: Settings;
  searchHistory: SearchHistoryEntry[];
}

// ---------------------------------------------------------------------------
// Search result item
// ---------------------------------------------------------------------------
export interface SearchResult {
  wordId: string;
  wordKorean: string;
  wordEnglish: string;
  matchType: ElementType;
  matchedKorean: string;
  matchedEnglish: string;
  matchedIpa?: string;
  score: number; // lower is better for Levenshtein-based matches
  path: string[]; // human-readable breadcrumb
}

// ---------------------------------------------------------------------------
// Validation result
// ---------------------------------------------------------------------------
export interface ValidationReport {
  status: EntryStatus;
  missingChunks: number;
  missingCollocations: number;
  missingIdioms: number;
  message: string;
}

// Validation thresholds
export const MIN_CHUNKS = 2;
export const MIN_COLLOCATIONS = 2;
export const MIN_IDIOMS = 1;

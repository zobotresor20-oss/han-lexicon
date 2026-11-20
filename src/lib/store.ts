// han-Lexicon — Zustand store for UI state, settings, and navigation.
// Persists settings + navigation + search history to localStorage.
// Heavy lexical data lives in IndexedDB (see db.ts) and is queried with
// dexie-react-hooks useLiveQuery from components directly.

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  DEFAULT_SETTINGS,
  type Settings,
  type ExerciseType,
} from "./types";

export type MainTab = "dictionary" | "search" | "study" | "statistics" | "settings";

export type StudyActivity =
  | "menu"
  | "flashcards"
  | "free-recall"
  | "fill-blanks"
  | "complete-collocation"
  | "unscramble-chunks"
  | "idiom-quiz"
  | "word-matching"
  | "dictation"
  | "personal-production"
  | "daily-mini-text"
  | "srs-dashboard";

interface AppState {
  // Navigation
  activeTab: MainTab;
  studyActivity: StudyActivity;
  selectedWordId: string | null;
  searchQuery: string;
  searchDirection: "ko-en" | "en-ko";
  recentSearches: string[];

  // Settings
  settings: Settings;

  // PWA / install
  installPromptAvailable: boolean;
  isInstalled: boolean;

  // Global ephemeral flags
  ipaRevealed: boolean; // toggle to reveal IPA in exercises

  // Actions
  setActiveTab: (t: MainTab) => void;
  setStudyActivity: (a: StudyActivity) => void;
  setSelectedWordId: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  setSearchDirection: (d: "ko-en" | "en-ko") => void;
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
  setInstallPromptAvailable: (v: boolean) => void;
  setIsInstalled: (v: boolean) => void;
  setIpaRevealed: (v: boolean) => void;
  navigateToWord: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTab: "dictionary",
      studyActivity: "menu",
      selectedWordId: null,
      searchQuery: "",
      searchDirection: "ko-en",
      recentSearches: [],

      settings: { ...DEFAULT_SETTINGS },

      installPromptAvailable: false,
      isInstalled: false,
      ipaRevealed: false,

      setActiveTab: (t) => set({ activeTab: t, studyActivity: "menu" }),
      setStudyActivity: (a) => set({ studyActivity: a }),
      setSelectedWordId: (id) => set({ selectedWordId: id }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setSearchDirection: (d) => set({ searchDirection: d }),
      addRecentSearch: (q) => {
        const trimmed = q.trim();
        if (!trimmed) return;
        set((s) => ({
          recentSearches: [
            trimmed,
            ...s.recentSearches.filter((r) => r !== trimmed),
          ].slice(0, 20),
        }));
      },
      clearRecentSearches: () => set({ recentSearches: [] }),
      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      resetSettings: () => set({ settings: { ...DEFAULT_SETTINGS } }),
      setInstallPromptAvailable: (v) => set({ installPromptAvailable: v }),
      setIsInstalled: (v) => set({ isInstalled: v }),
      setIpaRevealed: (v) => set({ ipaRevealed: v }),
      navigateToWord: (id) =>
        set({ selectedWordId: id, activeTab: "dictionary" }),
    }),
    {
      name: "han-lexicon-store",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          // Noop storage during SSR
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          } as Storage;
        }
        return window.localStorage;
      }),
      partialize: (s) => ({
        // Persist only what should survive reloads
        activeTab: s.activeTab,
        settings: s.settings,
        recentSearches: s.recentSearches,
        searchDirection: s.searchDirection,
      }),
    }
  )
);

// Helper selectors / hooks
export function useExerciseTypeLabel(t: ExerciseType): string {
  switch (t) {
    case "flashcards": return "Flashcards";
    case "free-recall": return "Free Recall";
    case "fill-blanks": return "Fill in the Blanks";
    case "complete-collocation": return "Complete the Collocation";
    case "unscramble-chunks": return "Unscramble Chunks";
    case "idiom-quiz": return "Idiom Quiz";
    case "word-matching": return "Word Matching";
    case "dictation": return "Listening & Dictation";
    case "personal-production": return "Personal Production";
    case "daily-mini-text": return "Daily Mini Text";
  }
}

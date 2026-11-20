// han-Lexicon — Bidirectional search view with history and fuzzy matching.

"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDbSafe } from "@/lib/db";
import { useAppStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search as SearchIcon,
  XIcon,
  ClockIcon,
  ArrowRightLeftIcon,
  BookOpenIcon,
  Volume2Icon,
} from "lucide-react";
import { TopBar } from "@/components/common/BottomNav";
import { EmptyState } from "@/components/common/Primitives";
import { AudioButton } from "@/components/common/AudioButton";
import { searchEntries } from "@/lib/search";
import { logSearch, clearSearchHistory } from "@/lib/crud";
import { relativeTime } from "@/lib/utils-han";
import type { SearchResult } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<SearchResult["matchType"], string> = {
  word: "Word",
  chunk: "Chunk",
  collocation: "Collocation",
  idiom: "Idiom",
  example: "Example",
};

const TYPE_COLOR: Record<SearchResult["matchType"], string> = {
  word: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  chunk: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  collocation: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  idiom: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  example: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

export function SearchView() {
  const db = getDbSafe();
  const words = useLiveQuery(
    () => (db ? db.words.toArray() : Promise.resolve([])),
    [db],
    []
  );
  const history = useLiveQuery(
    () => (db ? db.searchHistory.orderBy("searchedAt").reverse().limit(15).toArray() : Promise.resolve([])),
    [db],
    []
  );

  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const direction = useAppStore((s) => s.searchDirection);
  const setDirection = useAppStore((s) => s.setSearchDirection);
  const navigateToWord = useAppStore((s) => s.navigateToWord);
  const recentSearches = useAppStore((s) => s.recentSearches);
  const addRecentSearch = useAppStore((s) => s.addRecentSearch);

  const [debounced, setDebounced] = useState(searchQuery);

  // Debounce search to avoid recomputing on every keystroke for big dictionaries
  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchQuery), 120);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const results = useMemo<SearchResult[]>(() => {
    if (!debounced.trim() || words.length === 0) return [];
    return searchEntries(debounced, words, direction, 50);
  }, [debounced, words, direction]);

  // Log search when query stabilizes
  useEffect(() => {
    if (!debounced.trim() || results.length === 0) return;
    const t = setTimeout(() => {
      logSearch(debounced, direction, results.length);
      addRecentSearch(debounced);
    }, 800);
    return () => clearTimeout(t);
  }, [debounced, direction, results.length, addRecentSearch]);

  const placeholder =
    direction === "ko-en"
      ? "Search Korean (word, fragment, expression, sentence)..."
      : "Search English (translation, fragment, expression, sentence)...";

  return (
    <div className="min-h-screen pb-32">
      <TopBar title="Search" subtitle="Bidirectional Korean ↔ English" />

      <div className="mx-auto max-w-3xl space-y-3 px-4 py-4">
        {/* Search bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder}
              className="pl-9 pr-9 text-base"
              autoFocus
              lang={direction === "ko-en" ? "ko" : undefined}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            size="icon"
            variant="outline"
            onClick={() =>
              setDirection(direction === "ko-en" ? "en-ko" : "ko-en")
            }
            aria-label="Swap direction"
            title={`Currently ${direction}. Tap to swap.`}
            className="h-10 w-10"
          >
            <ArrowRightLeftIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={cn(
              "rounded px-2 py-0.5 font-medium",
              direction === "ko-en"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
            )}
          >
            {direction === "ko-en" ? "Korean → English" : "English → Korean"}
          </span>
          {results.length > 0 && (
            <span>{results.length} results</span>
          )}
        </div>

        {/* Results */}
        {debounced.trim() && results.length === 0 && words.length > 0 && (
          <EmptyState
            icon={<SearchIcon className="h-6 w-6" />}
            title="No matches"
            description="Try a different fragment, swap the direction, or check the spelling. Partial and fuzzy matches are supported."
          />
        )}

        {results.length > 0 && (
          <ul className="space-y-2">
            {results.map((r, idx) => (
              <li key={`${r.wordId}-${idx}`}>
                <button
                  type="button"
                  onClick={() => navigateToWord(r.wordId)}
                  className="w-full rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            TYPE_COLOR[r.matchType]
                          )}
                        >
                          {TYPE_LABEL[r.matchType]}
                        </span>
                        {r.matchedKorean && (
                          <span className="font-medium" lang="ko">
                            {r.matchedKorean}
                          </span>
                        )}
                        {r.matchedKorean && (
                          <AudioButton text={r.matchedKorean} size="sm" />
                        )}
                      </div>
                      {r.matchedEnglish && (
                        <div className="mt-0.5 text-sm text-muted-foreground">
                          {r.matchedEnglish}
                        </div>
                      )}
                      {r.matchedIpa && (
                        <div className="font-mono text-xs text-muted-foreground">
                          /{r.matchedIpa}/
                        </div>
                      )}
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        From <span lang="ko">{r.wordKorean}</span> · {r.wordEnglish}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {r.path.join(" › ")}
                      </div>
                    </div>
                    <BookOpenIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* History + recent searches when query is empty */}
        {!debounced.trim() && (
          <div className="space-y-4">
            {recentSearches.length > 0 && (
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    <ClockIcon className="h-3.5 w-3.5" /> Recent searches
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => useAppStore.getState().clearRecentSearches()}
                  >
                    Clear
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setSearchQuery(q)}
                      className="rounded-full border bg-background px-2.5 py-1 text-xs hover:bg-accent"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {history && history.length > 0 && (
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    <ClockIcon className="h-3.5 w-3.5" /> Search history
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await clearSearchHistory();
                    }}
                  >
                    Clear
                  </Button>
                </div>
                <ul className="space-y-1">
                  {history.map((h) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setDirection(h.direction);
                          setSearchQuery(h.query);
                        }}
                        className="flex w-full items-center justify-between rounded-md border bg-background px-2 py-1.5 text-left text-sm hover:bg-accent"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-medium",
                              h.direction === "ko-en"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                            )}
                          >
                            {h.direction === "ko-en" ? "KO→EN" : "EN→KO"}
                          </span>
                          <span className="truncate">{h.query}</span>
                        </span>
                        <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          {h.resultCount} hits · {relativeTime(h.searchedAt)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {recentSearches.length === 0 && (!history || history.length === 0) && (
              <EmptyState
                icon={<SearchIcon className="h-6 w-6" />}
                title="Search your dictionary"
                description="Type any Korean or English fragment, expression, or full sentence. Partial and fuzzy matches are supported."
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export { Volume2Icon };

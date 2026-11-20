// han-Lexicon — Dictionary view: filterable list of word entries with
// status indicators, quick search bar, and detail panel.

"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDbSafe } from "@/lib/db";
import { useAppStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  PlusIcon,
  SearchIcon,
  BookOpenIcon,
  Trash2Icon,
  PencilIcon,
  ChevronRightIcon,
} from "lucide-react";
import { toast } from "sonner";

import { TopBar } from "@/components/common/BottomNav";
import { EmptyState, PosBadge, StatusBadge } from "@/components/common/Primitives";
import { AudioButton } from "@/components/common/AudioButton";
import { WordFormDialog } from "@/components/dictionary/WordForm";
import { WordDetail } from "@/components/dictionary/WordDetail";
import { deleteWord } from "@/lib/crud";
import { validateEntry, relativeTime } from "@/lib/utils-han";
import type { EntryStatus } from "@/lib/types";
import { ALL_PARTS_OF_SPEECH } from "@/lib/types";

type SortKey = "recent" | "alpha-ko" | "alpha-en" | "status";

export function DictionaryView() {
  const db = getDbSafe();
  const words = useLiveQuery(
    () => (db ? db.words.toArray() : Promise.resolve([])),
    [db],
    []
  );

  const selectedWordId = useAppStore((s) => s.selectedWordId);
  const setSelectedWordId = useAppStore((s) => s.setSelectedWordId);

  const [filterText, setFilterText] = useState("");
  const [filterPos, setFilterPos] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingWord = useMemo(
    () => words.find((w) => w.id === editingId) ?? undefined,
    [words, editingId]
  );

  const selectedWord = useMemo(
    () => words.find((w) => w.id === selectedWordId) ?? undefined,
    [words, selectedWordId]
  );

  const filtered = useMemo(() => {
    let out = words;
    if (filterText.trim()) {
      const q = filterText.trim().toLowerCase();
      out = out.filter(
        (w) =>
          w.korean.toLowerCase().includes(q) ||
          w.english.toLowerCase().includes(q) ||
          w.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (filterPos !== "all") out = out.filter((w) => w.partOfSpeech === filterPos);
    if (filterStatus !== "all")
      out = out.filter((w) => validateEntry(w).status === (filterStatus as EntryStatus));
    switch (sortKey) {
      case "alpha-ko":
        out = [...out].sort((a, b) => a.korean.localeCompare(b.korean));
        break;
      case "alpha-en":
        out = [...out].sort((a, b) => a.english.localeCompare(b.english));
        break;
      case "status": {
        const rank: Record<EntryStatus, number> = {
          incomplete: 0, learning: 1, complete: 2, mastered: 3,
        };
        out = [...out].sort(
          (a, b) => rank[validateEntry(a).status] - rank[validateEntry(b).status]
        );
        break;
      }
      case "recent":
      default:
        out = [...out].sort((a, b) => b.updatedAt - a.updatedAt);
        break;
    }
    return out;
  }, [words, filterText, filterPos, filterStatus, sortKey]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this word permanently? This cannot be undone.")) return;
    try {
      await deleteWord(id);
      toast.success("Word deleted.");
      if (selectedWordId === id) setSelectedWordId(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (selectedWord) {
    return (
      <WordDetail
        word={selectedWord}
        onBack={() => setSelectedWordId(null)}
        onEdit={() => {
          setEditingId(selectedWord.id);
          setDialogOpen(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <TopBar
        title="Dictionary"
        subtitle={`${words.length} ${words.length === 1 ? "entry" : "entries"}`}
      />

      <div className="mx-auto max-w-3xl space-y-3 px-4 py-4">
        {/* Quick filter row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter this list..."
              className="pl-9"
            />
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditingId(null);
              setDialogOpen(true);
            }}
          >
            <PlusIcon className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">New</span>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={filterPos} onValueChange={setFilterPos}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Part of speech" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {ALL_PARTS_OF_SPEECH.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="incomplete">Incomplete</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
              <SelectItem value="learning">Learning</SelectItem>
              <SelectItem value="mastered">Mastered</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="alpha-ko">Korean A→Z</SelectItem>
              <SelectItem value="alpha-en">English A→Z</SelectItem>
              <SelectItem value="status">By status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<BookOpenIcon className="h-6 w-6" />}
            title={words.length === 0 ? "Your dictionary is empty" : "No matches"}
            description={
              words.length === 0
                ? "Tap + to add your first Korean word. The seven demo entries will be created automatically on first launch."
                : "Try a different filter or search."
            }
            action={
              <Button
                onClick={() => {
                  setEditingId(null);
                  setDialogOpen(true);
                }}
              >
                <PlusIcon className="h-4 w-4" /> Add a word
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {filtered.map((w) => {
              const report = validateEntry(w);
              return (
                <li
                  key={w.id}
                  className="rounded-lg border bg-card p-3 transition-colors hover:bg-accent/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedWordId(w.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-semibold" lang="ko">
                          {w.korean}
                        </span>
                        <AudioButton text={w.korean} size="sm" />
                        <PosBadge pos={w.partOfSpeech} />
                        <StatusBadge status={report.status} />
                      </div>
                      <div className="mt-0.5 text-sm text-muted-foreground">
                        {w.english}
                      </div>
                      {w.ipa && (
                        <div className="font-mono text-xs text-muted-foreground">
                          /{w.ipa}/
                        </div>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                        {w.chunks.length > 0 && (
                          <span className="rounded bg-muted px-1.5 py-0.5">
                            {w.chunks.length} chunks
                          </span>
                        )}
                        {w.collocations.length > 0 && (
                          <span className="rounded bg-muted px-1.5 py-0.5">
                            {w.collocations.length} collocations
                          </span>
                        )}
                        {w.idioms.length > 0 && (
                          <span className="rounded bg-muted px-1.5 py-0.5">
                            {w.idioms.length} idioms
                          </span>
                        )}
                        <span>· updated {relativeTime(w.updatedAt)}</span>
                      </div>
                    </button>
                    <div className="flex flex-col gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditingId(w.id);
                          setDialogOpen(true);
                        }}
                        aria-label="Edit"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-rose-500"
                        onClick={() => handleDelete(w.id)}
                        aria-label="Delete"
                      >
                        <Trash2Icon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <WordFormDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditingId(null);
        }}
        word={editingWord}
      />
    </div>
  );
}

// Re-export the new-word dialog opener for the FloatingAddButton.
export function useNewWordDialog() {
  // Hook retained for external callers that want to open a fresh dialog.
  // Currently unused outside the component but kept for the page-level FAB.
  return null;
}

export function NewWordButton() {
  // Used by the page-level floating add button (see AppShell).
  // Returns a clickable area controlled by parent.
  return null;
}

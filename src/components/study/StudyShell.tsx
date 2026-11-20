// han-Lexicon — Shared study session scaffolding (header, IPA reveal toggle,
// session config).

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import { TopBar } from "@/components/common/BottomNav";
import { useAppStore } from "@/lib/store";
import type { WordEntry, ExerciseType } from "@/lib/types";

export interface SessionConfig {
  questionCount: number;
  hideIpa: boolean;
  difficulty: "easy" | "normal" | "hard";
  mode: "normal" | "mistakes";
}

export const DEFAULT_SESSION: SessionConfig = {
  questionCount: 10,
  hideIpa: true,
  difficulty: "normal",
  mode: "normal",
};

interface Props {
  title: string;
  subtitle?: string;
  onExit: () => void;
  children: React.ReactNode;
  /** When provided, render the session-config form before children. */
  showConfig?: boolean;
  config?: SessionConfig;
  onConfigChange?: (c: SessionConfig) => void;
}

export function StudyShell({
  title,
  subtitle,
  onExit,
  children,
  showConfig,
  config,
  onConfigChange,
}: Props) {
  return (
    <div className="min-h-screen pb-32">
      <TopBar title={title} subtitle={subtitle} />
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onExit}>
            <ArrowLeftIcon className="h-4 w-4" /> Back to activities
          </Button>
        </div>
        {showConfig && config && onConfigChange && (
          <SessionConfigForm config={config} onChange={onConfigChange} />
        )}
        {children}
      </div>
    </div>
  );
}

function SessionConfigForm({
  config,
  onChange,
}: {
  config: SessionConfig;
  onChange: (c: SessionConfig) => void;
}) {
  return (
    <div className="grid gap-3 rounded-lg border bg-card p-3 sm:grid-cols-2">
      <div className="grid gap-1.5">
        <Label className="text-xs">Number of questions</Label>
        <Select
          value={String(config.questionCount)}
          onValueChange={(v) => onChange({ ...config, questionCount: Number(v) })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {[5, 10, 15, 20, 30, 50].map((n) => (
              <SelectItem key={n} value={String(n)}>{n} questions</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label className="text-xs">Difficulty</Label>
        <Select
          value={config.difficulty}
          onValueChange={(v) =>
            onChange({ ...config, difficulty: v as SessionConfig["difficulty"] })
          }
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="easy">Easy (more forgiving)</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="hard">Hard (faster decay)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label className="text-xs">Mode</Label>
        <Select
          value={config.mode}
          onValueChange={(v) =>
            onChange({ ...config, mode: v as SessionConfig["mode"] })
          }
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="mistakes">My mistakes only</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between rounded-md border p-2">
        <div>
          <Label className="text-xs">Hide IPA</Label>
          <p className="text-[10px] text-muted-foreground">
            Hide pronunciation during this session
          </p>
        </div>
        <Switch
          checked={config.hideIpa}
          onCheckedChange={(v) => onChange({ ...config, hideIpa: v })}
        />
      </div>
    </div>
  );
}

// Ipa reveal toggle button for activity bodies
export function IpaRevealToggle() {
  const ipaRevealed = useAppStore((s) => s.ipaRevealed);
  const setIpaRevealed = useAppStore((s) => s.setIpaRevealed);
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={() => setIpaRevealed(!ipaRevealed)}
    >
      {ipaRevealed ? (
        <>
          <EyeOffIcon className="h-4 w-4" /> Hide IPA
        </>
      ) : (
        <>
          <EyeIcon className="h-4 w-4" /> Reveal IPA
        </>
      )}
    </Button>
  );
}

// Filter a list of words for an exercise. Excludes words without the
// required data shape (e.g. fill-blanks needs example sentences).
export function filterEligibleWords(
  words: WordEntry[],
  type: ExerciseType
): WordEntry[] {
  switch (type) {
    case "fill-blanks":
      // Need at least one example sentence somewhere
      return words.filter((w) => {
        const exs = [
          ...w.examples,
          ...w.chunks.flatMap((c) => c.examples),
          ...w.collocations.flatMap((c) => c.examples),
          ...w.idioms.flatMap((i) => i.examples),
        ];
        return exs.length > 0;
      });
    case "complete-collocation":
      return words.filter((w) => w.collocations.length > 0);
    case "unscramble-chunks":
      return words.filter((w) => w.chunks.length > 0);
    case "idiom-quiz":
      return words.filter((w) => w.idioms.length > 0);
    case "word-matching":
      return words.filter((w) => w.english && w.korean);
    case "dictation":
      return words.filter((w) => w.korean);
    case "flashcards":
    case "free-recall":
    default:
      return words;
  }
}

// Pick the words actually used in a session: optionally restricted to
// "my mistakes" (lastQuality < 3).
export function pickSessionWords(
  words: WordEntry[],
  count: number,
  mode: "normal" | "mistakes"
): WordEntry[] {
  let pool = words;
  if (mode === "mistakes") {
    pool = words.filter((w) => w.srs.lastQuality !== undefined && w.srs.lastQuality < 3);
    if (pool.length === 0) pool = words; // fallback
  }
  // Shuffle + slice
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Convenience hook for showing exercise-level IPA reveal that respects
// the global setting AND a local override.
export function useIpaVisibility(hideIpaFromConfig: boolean): {
  hidden: boolean;
  reveal: () => void;
  toggle: IpaRevealToggle;
} {
  const settings = useAppStore((s) => s.settings);
  const ipaRevealed = useAppStore((s) => s.ipaRevealed);
  const setIpaRevealed = useAppStore((s) => s.setIpaRevealed);
  const hide = hideIpaFromConfig && settings.hidePronunciationDuringExercises && !ipaRevealed;
  return {
    hidden: hide,
    reveal: () => setIpaRevealed(true),
    toggle: IpaRevealToggle,
  };
}

// Exporting types for downstream components
export type { WordEntry };
export type { ExerciseType };

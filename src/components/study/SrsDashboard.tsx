// han-Lexicon — SRS dashboard (due today / upcoming / learning / mastered / missed).

"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ClockIcon,
  CalendarIcon,
  BrainIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  RotateCcwIcon,
} from "lucide-react";
import { StudyShell } from "@/components/study/StudyShell";
import { AudioButton } from "@/components/common/AudioButton";
import { StatusBadge, PosBadge, EmptyState } from "@/components/common/Primitives";
import { srsBucket, type SrsBucket } from "@/lib/sm2";
import { reviewItem } from "@/lib/crud";
import { relativeTime } from "@/lib/utils-han";
import type { WordEntry } from "@/lib/types";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";

interface Props {
  words: WordEntry[];
  onExit: () => void;
}

const BUCKETS: { id: SrsBucket; title: string; icon: typeof ClockIcon; color: string; description: string }[] = [
  { id: "due", title: "Due today", icon: ClockIcon, color: "text-rose-600 dark:text-rose-400", description: "Review now" },
  { id: "upcoming", title: "Upcoming reviews", icon: CalendarIcon, color: "text-sky-600 dark:text-sky-400", description: "Scheduled in the future" },
  { id: "learning", title: "Learning", icon: BrainIcon, color: "text-amber-600 dark:text-amber-400", description: "First two repetitions" },
  { id: "mastered", title: "Mastered", icon: CheckCircle2Icon, color: "text-emerald-600 dark:text-emerald-400", description: "Long interval reached" },
  { id: "missed", title: "Missed words", icon: AlertCircleIcon, color: "text-rose-600 dark:text-rose-400", description: "Last review failed" },
];

export function SrsDashboard({ words, onExit }: Props) {
  const now = Date.now();
  const grouped = useMemo(() => {
    const map: Record<SrsBucket, WordEntry[]> = {
      due: [], upcoming: [], learning: [], mastered: [], missed: [],
    };
    for (const w of words) {
      map[srsBucket(w.srs, now)].push(w);
    }
    // Sort each bucket by dueDate asc
    for (const k of Object.keys(map) as SrsBucket[]) {
      map[k].sort((a, b) => a.srs.dueDate - b.srs.dueDate);
    }
    return map;
  }, [words, now]);

  const navigateToWord = useAppStore((s) => s.navigateToWord);

  return (
    <StudyShell
      title="SRS Dashboard"
      subtitle="Spaced repetition queue"
      onExit={onExit}
    >
      {words.length === 0 ? (
        <EmptyState
          icon={<ClockIcon className="h-6 w-6" />}
          title="Nothing to review yet"
          description="Add a few words and review them once to start your spaced repetition queue."
        />
      ) : (
        <div className="space-y-4">
          {BUCKETS.map((b) => {
            const items = grouped[b.id];
            if (items.length === 0) return null;
            const Icon = b.icon;
            return (
              <Card key={b.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className={`h-4 w-4 ${b.color}`} />
                    {b.title}
                    <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
                      {items.length}
                    </span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{b.description}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {items.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between gap-2 rounded-md border bg-background p-2"
                    >
                      <button
                        type="button"
                        onClick={() => navigateToWord(w.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium" lang="ko">{w.korean}</span>
                          <AudioButton text={w.korean} size="sm" />
                          <PosBadge pos={w.partOfSpeech} />
                          <StatusBadge status={w.status} />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {w.english}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Interval: {w.srs.interval}d · Ease: {w.srs.easeFactor.toFixed(2)} · Reps: {w.srs.repetitions}
                          {w.srs.lastReviewDate && ` · last ${relativeTime(w.srs.lastReviewDate)}`}
                        </div>
                      </button>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await reviewItem(w.id, "word", true, "normal");
                              toast.success("Marked as known.");
                            } catch (e) {
                              toast.error((e as Error).message);
                            }
                          }}
                          className="border-emerald-400 text-emerald-600 hover:bg-emerald-50"
                        >
                          <CheckCircle2Icon className="h-4 w-4" /> Knew
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await reviewItem(w.id, "word", false, "normal");
                              toast.info("Marked as missed — will reappear sooner.");
                            } catch (e) {
                              toast.error((e as Error).message);
                            }
                          }}
                          className="border-rose-400 text-rose-600 hover:bg-rose-50"
                        >
                          <RotateCcwIcon className="h-4 w-4" /> Missed
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </StudyShell>
  );
}

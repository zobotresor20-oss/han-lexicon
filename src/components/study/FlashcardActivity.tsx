// han-Lexicon — Flashcard activity (Korean ↔ English, words or sub-elements).

"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckIcon,
  XIcon,
  Volume2Icon,
  RefreshCwIcon,
  EyeIcon,
  ChevronRightIcon,
} from "lucide-react";
import { StudyShell, useIpaVisibility } from "@/components/study/StudyShell";
import { AudioButton } from "@/components/common/AudioButton";
import { EmptyState } from "@/components/common/Primitives";
import { reviewItem } from "@/lib/crud";
import { sampleN } from "@/lib/utils-han";
import type { WordEntry } from "@/lib/types";
import { toast } from "sonner";

interface CardItem {
  wordId: string;
  prompt: string; // korean if ko-en, english if en-ko
  answer: string; // opposite of prompt
  ipa?: string;
  audioText: string; // always korean text for TTS
  path: string;
}

interface Props {
  words: WordEntry[];
  onExit: () => void;
}

export function FlashcardActivity({ words, onExit }: Props) {
  const [direction, setDirection] = useState<"ko-en" | "en-ko">("ko-en");
  const [scope, setScope] = useState<"words" | "chunks" | "collocations" | "idioms">("words");
  const [count, setCount] = useState(10);
  const [hideIpa, setHideIpa] = useState(true);

  const [deck, setDeck] = useState<CardItem[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState({ known: 0, missed: 0 });

  // Build the deck whenever parameters change
  useEffect(() => {
    const pool: CardItem[] = [];
    for (const w of words) {
      if (scope === "words") {
        pool.push({
          wordId: w.id,
          prompt: direction === "ko-en" ? w.korean : w.english,
          answer: direction === "ko-en" ? w.english : w.korean,
          ipa: w.ipa,
          audioText: w.korean,
          path: `Word`,
        });
      } else if (scope === "chunks") {
        for (const c of w.chunks) {
          pool.push({
            wordId: w.id,
            prompt: direction === "ko-en" ? c.korean : c.english,
            answer: direction === "ko-en" ? c.english : c.korean,
            ipa: c.ipa,
            audioText: c.korean,
            path: `Word › Chunk`,
          });
        }
      } else if (scope === "collocations") {
        for (const c of w.collocations) {
          pool.push({
            wordId: w.id,
            prompt: direction === "ko-en" ? c.korean : c.english,
            answer: direction === "ko-en" ? c.english : c.korean,
            ipa: c.ipa,
            audioText: c.korean,
            path: `Word › Collocation`,
          });
        }
      } else if (scope === "idioms") {
        for (const i of w.idioms) {
          pool.push({
            wordId: w.id,
            prompt: direction === "ko-en" ? i.korean : i.english,
            answer: direction === "ko-en" ? i.english : i.korean,
            ipa: i.ipa,
            audioText: i.korean,
            path: `Word › Idiom`,
          });
        }
      }
    }
    const picked = sampleN(pool, count);
    setDeck(picked);
    setIndex(0);
    setRevealed(false);
    setStats({ known: 0, missed: 0 });
  }, [words, direction, scope, count]);

  const current = deck[index];
  const { hidden, reveal } = useIpaVisibility(hideIpa);

  const handleAnswer = async (knew: boolean) => {
    if (!current) return;
    try {
      await reviewItem(
        current.wordId,
        scope === "words" ? "word" : scope === "chunks" ? "chunk" : scope === "collocations" ? "collocation" : "idiom",
        knew,
        "normal"
      );
    } catch (e) {
      // swallow; reviews are best-effort
    }
    setStats((s) => ({
      known: s.known + (knew ? 1 : 0),
      missed: s.missed + (knew ? 0 : 1),
    }));
    setRevealed(false);
    setIndex((i) => i + 1);
  };

  // Final summary
  if (deck.length > 0 && index >= deck.length) {
    return (
      <StudyShell title="Flashcards" subtitle="Session complete" onExit={onExit}>
        <Card>
          <CardContent className="space-y-3 p-6 text-center">
            <div className="text-3xl font-bold text-emerald-600">
              {stats.known} / {deck.length}
            </div>
            <p className="text-sm text-muted-foreground">
              You knew {stats.known} cards and missed {stats.missed}.
            </p>
            <Button
              onClick={() => {
                setIndex(0);
                setRevealed(false);
                setStats({ known: 0, missed: 0 });
                // reshuffle
                const pool: CardItem[] = [];
                for (const w of words) {
                  if (scope === "words") {
                    pool.push({
                      wordId: w.id,
                      prompt: direction === "ko-en" ? w.korean : w.english,
                      answer: direction === "ko-en" ? w.english : w.korean,
                      ipa: w.ipa,
                      audioText: w.korean,
                      path: "Word",
                    });
                  }
                  // Other scopes re-built on next param change; for restart just
                  // reuse what we have by re-sampling from words only when scope is words.
                }
                if (scope === "words") {
                  setDeck(sampleN(pool, count));
                } else {
                  // Force re-build by toggling
                  setCount((c) => c);
                }
              }}
            >
              <RefreshCwIcon className="h-4 w-4" /> Restart
            </Button>
          </CardContent>
        </Card>
      </StudyShell>
    );
  }

  if (deck.length === 0) {
    return (
      <StudyShell title="Flashcards" onExit={onExit}>
        <EmptyState
          icon={<Volume2Icon className="h-6 w-6" />}
          title="No cards available"
          description={`Add some ${scope} first.`}
        />
      </StudyShell>
    );
  }

  return (
    <StudyShell
      title="Flashcards"
      subtitle={`${index + 1} / ${deck.length} · ${direction === "ko-en" ? "Korean → English" : "English → Korean"}`}
      onExit={onExit}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Select value={direction} onValueChange={(v) => setDirection(v as "ko-en" | "en-ko")}>
          <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ko-en">Korean → English</SelectItem>
            <SelectItem value="en-ko">English → Korean</SelectItem>
          </SelectContent>
        </Select>
        <Select value={scope} onValueChange={(v) => setScope(v as typeof scope)}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="words">Words</SelectItem>
            <SelectItem value="chunks">Chunks</SelectItem>
            <SelectItem value="collocations">Collocations</SelectItem>
            <SelectItem value="idioms">Idioms</SelectItem>
          </SelectContent>
        </Select>
        <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
          <SelectTrigger className="h-9 w-[110px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[5, 10, 15, 20, 30].map((n) => (
              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-2">
        <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {current.path}
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold sm:text-4xl" lang={direction === "ko-en" ? "ko" : undefined}>
              {current.prompt}
            </h2>
            <AudioButton text={current.audioText} size="default" />
          </div>
          {current.ipa && !hidden && (
            <div className="font-mono text-sm text-muted-foreground">
              /{current.ipa}/
            </div>
          )}
          {current.ipa && hidden && (
            <button
              type="button"
              onClick={reveal}
              className="text-xs text-muted-foreground underline"
            >
              reveal IPA
            </button>
          )}

          {revealed ? (
            <div className="mt-2 w-full border-t pt-4">
              <div className="text-lg text-muted-foreground" lang={direction === "en-ko" ? "ko" : undefined}>
                {current.answer}
              </div>
            </div>
          ) : (
            <Button onClick={() => setRevealed(true)} variant="outline">
              <EyeIcon className="h-4 w-4" /> Reveal answer
            </Button>
          )}
        </CardContent>
      </Card>

      {revealed && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="border-rose-400 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
            onClick={() => handleAnswer(false)}
          >
            <XIcon className="h-4 w-4" /> I didn&apos;t know it
          </Button>
          <Button
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => handleAnswer(true)}
          >
            <CheckIcon className="h-4 w-4" /> I knew it
          </Button>
        </div>
      )}
    </StudyShell>
  );
}

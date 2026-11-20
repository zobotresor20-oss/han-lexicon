// han-Lexicon — Free recall activity.
// Show a Korean word; user types the chunks / collocations / idioms they recall.
// Then reveal stored answers for comparison.

"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { CheckIcon, EyeIcon, RefreshCwIcon, ChevronRightIcon } from "lucide-react";
import { StudyShell, useIpaVisibility } from "@/components/study/StudyShell";
import { AudioButton } from "@/components/common/AudioButton";
import { EmptyState } from "@/components/common/Primitives";
import { reviewItem } from "@/lib/crud";
import { sampleN } from "@/lib/utils-han";
import type { WordEntry } from "@/lib/types";
import { toast } from "sonner";

interface Props {
  words: WordEntry[];
  onExit: () => void;
}

export function FreeRecallActivity({ words, onExit }: Props) {
  // Only words that have at least one sub-element make sense here.
  const eligible = useMemo(
    () =>
      words.filter(
        (w) => w.chunks.length + w.collocations.length + w.idioms.length > 0
      ),
    [words]
  );

  const [deck, setDeck] = useState<WordEntry[]>([]);
  const [index, setIndex] = useState(0);
  const [recall, setRecall] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState({ known: 0, missed: 0 });
  const { hidden, reveal } = useIpaVisibility(true);

  useEffect(() => {
    setDeck(sampleN(eligible, 10));
    setIndex(0);
    setRecall("");
    setRevealed(false);
    setStats({ known: 0, missed: 0 });
  }, [eligible]);

  const current = deck[index];

  if (eligible.length === 0) {
    return (
      <StudyShell title="Free Recall" onExit={onExit}>
        <EmptyState
          icon={<EyeIcon className="h-6 w-6" />}
          title="No words with sub-elements"
          description="Add chunks, collocations, or idioms to at least one word to use this activity."
        />
      </StudyShell>
    );
  }

  if (deck.length > 0 && index >= deck.length) {
    return (
      <StudyShell title="Free Recall" subtitle="Session complete" onExit={onExit}>
        <Card>
          <CardContent className="space-y-3 p-6 text-center">
            <div className="text-3xl font-bold text-emerald-600">{stats.known} / {deck.length}</div>
            <p className="text-sm text-muted-foreground">
              You felt you recalled {stats.known} words correctly.
            </p>
            <Button onClick={() => { setDeck(sampleN(eligible, 10)); setIndex(0); setRecall(""); setRevealed(false); setStats({ known: 0, missed: 0 }); }}>
              <RefreshCwIcon className="h-4 w-4" /> Restart
            </Button>
          </CardContent>
        </Card>
      </StudyShell>
    );
  }

  const handleAnswer = async (knew: boolean) => {
    if (!current) return;
    try {
      await reviewItem(current.id, "word", knew, "normal");
    } catch {}
    setStats((s) => ({ known: s.known + (knew ? 1 : 0), missed: s.missed + (knew ? 0 : 1) }));
    setRecall("");
    setRevealed(false);
    setIndex((i) => i + 1);
  };

  return (
    <StudyShell
      title="Free Recall"
      subtitle={`${index + 1} / ${deck.length} · recall the chunks, collocations, idioms`}
      onExit={onExit}
    >
      <Card className="border-2">
        <CardContent className="flex min-h-[180px] flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Word</div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold" lang="ko">{current.korean}</h2>
            <AudioButton text={current.korean} size="default" />
          </div>
          <div className="text-sm text-muted-foreground">{current.english}</div>
          {current.ipa && !hidden && (
            <div className="font-mono text-xs text-muted-foreground">/{current.ipa}/</div>
          )}
        </CardContent>
      </Card>

      <div className="mt-3">
        <label className="mb-1 block text-xs text-muted-foreground">
          Write down the chunks, collocations, and idioms you remember (one per line).
        </label>
        <Textarea
          value={recall}
          onChange={(e) => setRecall(e.target.value)}
          rows={6}
          placeholder={"e.g.\n사랑하다\n사랑에 빠지다\n큰 사랑\n..."}
          disabled={revealed}
        />
      </div>

      {revealed && (
        <Card className="mt-3 border-emerald-300">
          <CardContent className="space-y-3 p-4">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300">Chunks</div>
              <ul className="space-y-1 text-sm">
                {current.chunks.length === 0 && <li className="text-muted-foreground">— none —</li>}
                {current.chunks.map((c) => (
                  <li key={c.id} className="flex items-center gap-2">
                    <span lang="ko">{c.korean}</span>
                    <AudioButton text={c.korean} size="sm" />
                    <span className="text-muted-foreground">{c.english}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300">Collocations</div>
              <ul className="space-y-1 text-sm">
                {current.collocations.length === 0 && <li className="text-muted-foreground">— none —</li>}
                {current.collocations.map((c) => (
                  <li key={c.id} className="flex items-center gap-2">
                    <span lang="ko">{c.korean}</span>
                    <AudioButton text={c.korean} size="sm" />
                    <span className="text-muted-foreground">{c.english}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300">Idioms</div>
              <ul className="space-y-1 text-sm">
                {current.idioms.length === 0 && <li className="text-muted-foreground">— none —</li>}
                {current.idioms.map((i) => (
                  <li key={i.id} className="flex items-center gap-2">
                    <span lang="ko">{i.korean}</span>
                    <AudioButton text={i.korean} size="sm" />
                    <span className="text-muted-foreground">{i.english}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-3 flex gap-2">
        {!revealed ? (
          <Button variant="outline" onClick={() => setRevealed(true)}>
            <EyeIcon className="h-4 w-4" /> Reveal answers
          </Button>
        ) : (
          <>
            <Button variant="outline" className="border-rose-400 text-rose-600" onClick={() => handleAnswer(false)}>
              I missed most
            </Button>
            <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => handleAnswer(true)}>
              <CheckIcon className="h-4 w-4" /> I got most
            </Button>
          </>
        )}
      </div>
    </StudyShell>
  );
}

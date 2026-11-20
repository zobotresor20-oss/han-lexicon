// han-Lexicon — Daily Mini Text activity.
// Randomly selects 3 to 5 words from the personal dictionary and prompts
// the user to write a short Korean text using them.

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCwIcon, SaveIcon, CheckCircle2Icon } from "lucide-react";
import { StudyShell } from "@/components/study/StudyShell";
import { AudioButton } from "@/components/common/AudioButton";
import { EmptyState } from "@/components/common/Primitives";
import { sampleN } from "@/lib/utils-han";
import { bumpDailyStat } from "@/lib/crud";
import type { WordEntry } from "@/lib/types";
import { toast } from "sonner";

interface Props {
  words: WordEntry[];
  onExit: () => void;
}

export function DailyMiniTextActivity({ words, onExit }: Props) {
  const [picks, setPicks] = useState<WordEntry[]>([]);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    setPicks(sampleN(words, Math.min(Math.max(3, Math.min(5, words.length)), words.length)));
  }, [words]);

  const newRound = () => {
    setPicks(sampleN(words, Math.min(Math.max(3, Math.min(5, words.length)), words.length)));
    setText("");
    setSaved(false);
  };

  if (words.length < 3) {
    return (
      <StudyShell title="Daily Mini Text" onExit={onExit}>
        <EmptyState
          icon={<SaveIcon className="h-6 w-6" />}
          title="Not enough words yet"
          description="Add at least three words to your dictionary to use Daily Mini Text."
        />
      </StudyShell>
    );
  }

  const handleSave = async () => {
    if (text.trim().length < 8) {
      toast.error("Write at least a few words in Korean to save your mini text.");
      return;
    }
    // Record ~2 minutes of study time for this activity
    const elapsed = Date.now() - startTime;
    await bumpDailyStat({ studyTimeMsDelta: Math.min(elapsed, 5 * 60 * 1000) });
    setSaved(true);
    toast.success("Mini text recorded. Keep practicing!");
  };

  return (
    <StudyShell
      title="Daily Mini Text"
      subtitle="Write a short Korean text using these words"
      onExit={onExit}
    >
      <Card className="border-2">
        <CardContent className="space-y-3 p-6">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Use these words
          </div>
          <ul className="flex flex-wrap gap-2">
            {picks.map((w) => (
              <li
                key={w.id}
                className="flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-sm"
              >
                <span className="font-medium" lang="ko">{w.korean}</span>
                <AudioButton text={w.korean} size="sm" />
                <span className="text-muted-foreground">— {w.english}</span>
              </li>
            ))}
          </ul>
          <Button variant="outline" size="sm" onClick={newRound}>
            <RefreshCwIcon className="h-4 w-4" /> New words
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">
          Write a short Korean text using all the words above.
        </label>
        <Textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setSaved(false); }}
          rows={8}
          lang="ko"
          placeholder="예: 오늘은 친구와 학교에서 만났다. 우리는 같이 공부하고 밥을 먹었다..."
        />
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={saved}>
            <SaveIcon className="h-4 w-4" /> Save my text
          </Button>
          {text && <AudioButton text={text} size="sm" label="Hear" />}
          {saved && (
            <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2Icon className="h-4 w-4" /> Saved
            </span>
          )}
        </div>
      </div>
    </StudyShell>
  );
}

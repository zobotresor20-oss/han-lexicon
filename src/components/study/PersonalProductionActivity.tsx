// han-Lexicon — Personal production activity.
// User picks a word / chunk / idiom and writes their own Korean sentence,
// optionally saving it as a new example sentence attached to that element.

"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RefreshCwIcon, SaveIcon } from "lucide-react";
import { StudyShell } from "@/components/study/StudyShell";
import { AudioButton } from "@/components/common/AudioButton";
import { EmptyState } from "@/components/common/Primitives";
import { addExample } from "@/lib/crud";
import { sampleN } from "@/lib/utils-han";
import type { WordEntry } from "@/lib/types";
import { toast } from "sonner";

interface Props {
  words: WordEntry[];
  onExit: () => void;
}

type Target = {
  wordId: string;
  parentType: "word" | "chunk" | "collocation" | "idiom";
  parentId: string;
  korean: string;
  english: string;
};

export function PersonalProductionActivity({ words, onExit }: Props) {
  const targets = useMemo<Target[]>(() => {
    const out: Target[] = [];
    for (const w of words) {
      out.push({ wordId: w.id, parentType: "word", parentId: w.id, korean: w.korean, english: w.english });
      for (const c of w.chunks) out.push({ wordId: w.id, parentType: "chunk", parentId: c.id, korean: c.korean, english: c.english });
      for (const c of w.collocations) out.push({ wordId: w.id, parentType: "collocation", parentId: c.id, korean: c.korean, english: c.english });
      for (const i of w.idioms) out.push({ wordId: w.id, parentType: "idiom", parentId: i.id, korean: i.korean, english: i.english });
    }
    return out;
  }, [words]);

  const [target, setTarget] = useState<Target | null>(() => sampleN(targets, 1)[0] ?? null);
  const [sentence, setSentence] = useState("");
  const [translation, setTranslation] = useState("");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const pickRandom = () => {
    setTarget(sampleN(targets, 1)[0] ?? null);
    setSentence("");
    setTranslation("");
    setNote("");
    setSaved(false);
  };

  const handleSave = async () => {
    if (!target) return;
    if (!sentence.trim() || !translation.trim()) {
      toast.error("Korean sentence and English translation are required.");
      return;
    }
    try {
      await addExample(target.wordId, {
        korean: sentence,
        english: translation,
        note: note || undefined,
        parentType: target.parentType,
        parentId: target.parentId,
      });
      toast.success("Saved as a new example sentence.");
      setSaved(true);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (targets.length === 0) {
    return (
      <StudyShell title="Personal Production" onExit={onExit}>
        <EmptyState
          icon={<SaveIcon className="h-6 w-6" />}
          title="Nothing to write about yet"
          description="Add words, chunks, collocations, or idioms first."
        />
      </StudyShell>
    );
  }

  return (
    <StudyShell
      title="Personal Production"
      subtitle="Write your own Korean sentence from a prompt"
      onExit={onExit}
    >
      <Card className="border-2">
        <CardContent className="space-y-3 p-6">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Prompt</div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold" lang="ko">{target?.korean}</h2>
            <AudioButton text={target?.korean ?? ""} size="default" />
          </div>
          <p className="text-sm text-muted-foreground">{target?.english}</p>
          <Button variant="outline" size="sm" onClick={pickRandom}>
            <RefreshCwIcon className="h-4 w-4" /> Pick another prompt
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="grid gap-1.5">
          <Label htmlFor="pp-ko">Your Korean sentence *</Label>
          <Textarea
            id="pp-ko"
            value={sentence}
            onChange={(e) => { setSentence(e.target.value); setSaved(false); }}
            placeholder="예: 저는 매일 사랑을 느낀다."
            lang="ko"
            rows={3}
          />
          <div className="flex items-center gap-2">
            {sentence && <AudioButton text={sentence} size="sm" label="Hear" />}
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="pp-en">English translation *</Label>
          <Input
            id="pp-en"
            value={translation}
            onChange={(e) => { setTranslation(e.target.value); setSaved(false); }}
            placeholder="e.g. I feel love every day."
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="pp-note">Personal note (optional)</Label>
          <Input
            id="pp-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything you want to remember."
          />
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={saved || !sentence || !translation}>
            <SaveIcon className="h-4 w-4" /> Save as example
          </Button>
          {saved && (
            <span className="text-sm text-emerald-600 dark:text-emerald-400">
              Saved! You can keep writing or pick another prompt.
            </span>
          )}
        </div>
      </div>
    </StudyShell>
  );
}

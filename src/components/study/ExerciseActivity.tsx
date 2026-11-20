// han-Lexicon — Exercise engine for 6 exercise types:
//   fill-blanks, complete-collocation, unscramble-chunks,
//   idiom-quiz, word-matching, dictation.

"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckIcon,
  XIcon,
  RefreshCwIcon,
  HeadphonesIcon,
  ArrowRightIcon,
} from "lucide-react";
import { StudyShell } from "@/components/study/StudyShell";
import { AudioButton } from "@/components/common/AudioButton";
import { EmptyState } from "@/components/common/Primitives";
import { reviewItem } from "@/lib/crud";
import { sampleN, shuffle, normalizeText } from "@/lib/utils-han";
import type { WordEntry, ExerciseType, ExampleSentence } from "@/lib/types";

interface Props {
  type: ExerciseType;
  words: WordEntry[];
  onExit: () => void;
}

const QUESTION_COUNT = 10;

export function ExerciseActivity({ type, words, onExit }: Props) {
  const titleMap: Record<string, string> = {
    "fill-blanks": "Fill in the Blanks",
    "complete-collocation": "Complete the Collocation",
    "unscramble-chunks": "Unscramble Chunks",
    "idiom-quiz": "Idiom Quiz",
    "word-matching": "Word Matching",
    "dictation": "Listening & Dictation",
  };
  return (
    <StudyShell title={titleMap[type] ?? "Exercise"} onExit={onExit}>
      <ExerciseBody type={type} words={words} />
    </StudyShell>
  );
}

function ExerciseBody({ type, words }: { type: ExerciseType; words: WordEntry[] }) {
  switch (type) {
    case "fill-blanks": return <FillBlanks words={words} />;
    case "complete-collocation": return <CompleteCollocation words={words} />;
    case "unscramble-chunks": return <UnscrambleChunks words={words} />;
    case "idiom-quiz": return <IdiomQuiz words={words} />;
    case "word-matching": return <WordMatching words={words} />;
    case "dictation": return <Dictation words={words} />;
    default: return null;
  }
}

// ---------------------------------------------------------------------------
// Question types
// ---------------------------------------------------------------------------
interface QBase {
  wordId: string;
  itemType: "word" | "chunk" | "collocation" | "idiom" | "example";
}
interface FillBlankQ extends QBase { kind: "fill-blanks"; sentence: ExampleSentence; blankedKorean: string; answer: string; audioText: string; }
interface CompleteCollocationQ extends QBase { kind: "complete-collocation"; korean: string; answer: string; english: string; audioText: string; }
interface UnscrambleQ extends QBase { kind: "unscramble-chunks"; tokens: string[]; answer: string; english: string; audioText: string; }
interface IdiomQuizQ extends QBase { kind: "idiom-quiz"; prompt: string; choices: string[]; answer: string; audioText: string; }
interface DictationQ extends QBase { kind: "dictation"; audioText: string; answer: string; english: string; }
type Question = FillBlankQ | CompleteCollocationQ | UnscrambleQ | IdiomQuizQ | DictationQ;

// ---------------------------------------------------------------------------
// Generic runner — questions advance one at a time, with summary at the end.
// onAnswer is called ONCE per question, at submit time.
// ---------------------------------------------------------------------------
function Runner({
  questions,
  renderQ,
}: {
  questions: Question[];
  renderQ: (q: Question, onAnswer: (correct: boolean) => void, onNext: () => void) => React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  if (questions.length === 0) {
    return (
      <EmptyState
        icon={<HeadphonesIcon className="h-6 w-6" />}
        title="No questions available"
        description="Add more vocabulary, examples, chunks, collocations, or idioms to use this exercise."
      />
    );
  }
  if (index >= questions.length) {
    const total = questions.length;
    const pct = Math.round((correctCount / total) * 100);
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-center">
          <div className="text-3xl font-bold text-emerald-600">
            {correctCount} / {total}
          </div>
          <p className="text-sm text-muted-foreground">
            Accuracy: {pct}% · Correct: {correctCount} · Missed: {wrongCount}
          </p>
          <Button
            onClick={() => {
              setIndex(0);
              setCorrectCount(0);
              setWrongCount(0);
            }}
          >
            <RefreshCwIcon className="h-4 w-4" /> Restart
          </Button>
        </CardContent>
      </Card>
    );
  }
  const current = questions[index];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Question {index + 1} / {questions.length}</span>
        <span>Correct {correctCount} · Missed {wrongCount}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded bg-muted">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${(index / questions.length) * 100}%` }}
        />
      </div>
      {renderQ(
        current,
        async (correct) => {
          // Record once
          if (correct) setCorrectCount((c) => c + 1);
          else setWrongCount((c) => c + 1);
          try {
            await reviewItem(current.wordId, current.itemType, correct, "normal");
          } catch {}
        },
        () => setIndex((i) => i + 1)
      )}
    </div>
  );
}

// Helper to render the "Next" button visible after submit
function NextButton({ onNext, correct }: { onNext: () => void; correct: boolean }) {
  return (
    <Button variant="outline" onClick={onNext}>
      Next <ArrowRightIcon className="h-4 w-4" />
    </Button>
  );
}

function Feedback({ correct, answer }: { correct: boolean; answer: string }) {
  return (
    <div
      className={
        "rounded-md p-2 text-sm " +
        (correct
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
          : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200")
      }
    >
      {correct ? "Correct!" : `Answer: ${answer}`}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. Fill in the blanks
// ---------------------------------------------------------------------------
function FillBlanks({ words }: { words: WordEntry[] }) {
  const questions = useMemo<FillBlankQ[]>(() => {
    const out: FillBlankQ[] = [];
    for (const w of words) {
      const exs: ExampleSentence[] = [
        ...w.examples,
        ...w.chunks.flatMap((c) => c.examples),
        ...w.collocations.flatMap((c) => c.examples),
        ...w.idioms.flatMap((i) => i.examples),
      ];
      for (const ex of exs) {
        if (!ex.korean.includes(w.korean)) continue;
        const blanked = ex.korean.replace(w.korean, "＿＿＿＿");
        if (blanked === ex.korean) continue;
        out.push({
          kind: "fill-blanks",
          wordId: w.id,
          itemType: "word",
          sentence: ex,
          blankedKorean: blanked,
          answer: w.korean,
          audioText: ex.korean,
        });
      }
    }
    return sampleN(out, QUESTION_COUNT);
  }, [words]);

  return (
    <Runner
      questions={questions}
      renderQ={(q, onAnswer, onNext) => (
        <FillBlanksRenderer q={q as FillBlankQ} onAnswer={onAnswer} onNext={onNext} />
      )}
    />
  );
}
function FillBlanksRenderer({
  q, onAnswer, onNext,
}: { q: FillBlankQ; onAnswer: (c: boolean) => void; onNext: () => void }) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const correct = normalizeText(value) === normalizeText(q.answer);
  const submit = () => {
    if (submitted) return;
    setSubmitted(true);
    onAnswer(correct);
  };
  return (
    <Card className="border-2">
      <CardContent className="space-y-3 p-6">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Fill the blank</div>
        <div className="flex items-start gap-2">
          <p className="text-lg" lang="ko">{q.blankedKorean}</p>
          <AudioButton text={q.audioText} size="sm" />
        </div>
        <p className="text-sm text-muted-foreground">{q.sentence.english}</p>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type the missing Korean word"
          lang="ko"
          disabled={submitted}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        {submitted && <Feedback correct={correct} answer={q.answer} />}
        <div className="flex gap-2">
          {!submitted ? (
            <Button onClick={submit}><CheckIcon className="h-4 w-4" /> Submit</Button>
          ) : (
            <NextButton onNext={onNext} correct={correct} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 2. Complete the collocation
// ---------------------------------------------------------------------------
function CompleteCollocation({ words }: { words: WordEntry[] }) {
  const questions = useMemo<CompleteCollocationQ[]>(() => {
    const out: CompleteCollocationQ[] = [];
    for (const w of words) {
      for (const c of w.collocations) {
        if (!c.korean.includes(w.korean)) continue;
        const blanked = c.korean.replace(w.korean, "＿＿＿");
        if (blanked === c.korean) continue;
        out.push({
          kind: "complete-collocation",
          wordId: w.id,
          itemType: "collocation",
          korean: blanked,
          answer: w.korean,
          english: c.english,
          audioText: c.korean,
        });
      }
    }
    return sampleN(out, QUESTION_COUNT);
  }, [words]);

  return (
    <Runner
      questions={questions}
      renderQ={(q, onAnswer, onNext) => (
        <CompleteCollocationRenderer q={q as CompleteCollocationQ} onAnswer={onAnswer} onNext={onNext} />
      )}
    />
  );
}
function CompleteCollocationRenderer({
  q, onAnswer, onNext,
}: { q: CompleteCollocationQ; onAnswer: (c: boolean) => void; onNext: () => void }) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const correct = normalizeText(value) === normalizeText(q.answer);
  const submit = () => { if (submitted) return; setSubmitted(true); onAnswer(correct); };
  return (
    <Card className="border-2">
      <CardContent className="space-y-3 p-6">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Complete the collocation</div>
        <div className="flex items-center gap-2">
          <p className="text-lg" lang="ko">{q.korean}</p>
          <AudioButton text={q.audioText} size="sm" />
        </div>
        <p className="text-sm text-muted-foreground">Hint: {q.english}</p>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Missing word"
          lang="ko"
          disabled={submitted}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        {submitted && <Feedback correct={correct} answer={q.answer} />}
        <div className="flex gap-2">
          {!submitted ? (
            <Button onClick={submit}><CheckIcon className="h-4 w-4" /> Submit</Button>
          ) : (
            <NextButton onNext={onNext} correct={correct} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 3. Unscramble chunks
// ---------------------------------------------------------------------------
function UnscrambleChunks({ words }: { words: WordEntry[] }) {
  const questions = useMemo<UnscrambleQ[]>(() => {
    const out: UnscrambleQ[] = [];
    for (const w of words) {
      for (const c of w.chunks) {
        const tokens = c.korean.split(/\s+/).filter(Boolean);
        if (tokens.length < 2) continue;
        out.push({
          kind: "unscramble-chunks",
          wordId: w.id,
          itemType: "chunk",
          tokens,
          answer: c.korean,
          english: c.english,
          audioText: c.korean,
        });
      }
    }
    return sampleN(out, QUESTION_COUNT);
  }, [words]);

  return (
    <Runner
      questions={questions}
      renderQ={(q, onAnswer, onNext) => (
        <UnscrambleRenderer q={q as UnscrambleQ} onAnswer={onAnswer} onNext={onNext} />
      )}
    />
  );
}
function UnscrambleRenderer({
  q, onAnswer, onNext,
}: { q: UnscrambleQ; onAnswer: (c: boolean) => void; onNext: () => void }) {
  const [shuffled] = useState(() => shuffle(q.tokens));
  const [pickedKeys, setPickedKeys] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const pickedTokens = pickedKeys.map((k) => shuffled[Number(k.split("-")[1])]);
  const remaining = shuffled
    .map((tok, idx) => ({ tok, idx, key: `${tok}-${idx}` }))
    .filter((x) => !pickedKeys.includes(x.key));
  const composed = pickedTokens.join(" ");
  const correct = normalizeText(composed) === normalizeText(q.answer);
  const submit = () => { if (submitted) return; setSubmitted(true); onAnswer(correct); };
  return (
    <Card className="border-2">
      <CardContent className="space-y-3 p-6">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Unscramble the chunk</div>
        <p className="text-sm text-muted-foreground">Hint: {q.english}</p>
        <div className="min-h-[3rem] rounded-md border bg-muted/30 p-2">
          {pickedTokens.length === 0 ? (
            <span className="text-xs text-muted-foreground">Tap tokens below in order...</span>
          ) : (
            <div className="flex flex-wrap gap-1.5" lang="ko">
              {pickedTokens.map((tok, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => !submitted && setPickedKeys((p) => p.filter((_, j) => j !== i))}
                  className="rounded-md border bg-background px-2 py-1 text-sm"
                >
                  {tok}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {remaining.map(({ tok, key }) => (
            <button
              key={key}
              type="button"
              onClick={() => !submitted && setPickedKeys((p) => [...p, key])}
              className="rounded-md border bg-background px-2 py-1 text-sm hover:bg-accent"
              lang="ko"
            >
              {tok}
            </button>
          ))}
          {remaining.length === 0 && submitted === false && (
            <span className="text-xs text-muted-foreground">All tokens placed.</span>
          )}
        </div>
        {submitted && <Feedback correct={correct} answer={q.answer} />}
        <div className="flex gap-2">
          {!submitted ? (
            <>
              <Button variant="ghost" onClick={() => setPickedKeys([])}>Reset</Button>
              <Button onClick={submit}><CheckIcon className="h-4 w-4" /> Submit</Button>
            </>
          ) : (
            <NextButton onNext={onNext} correct={correct} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 4. Idiom quiz
// ---------------------------------------------------------------------------
function IdiomQuiz({ words }: { words: WordEntry[] }) {
  const questions = useMemo<IdiomQuizQ[]>(() => {
    const all: { wordId: string; korean: string; english: string }[] = [];
    for (const w of words) {
      for (const i of w.idioms) {
        all.push({ wordId: w.id, korean: i.korean, english: i.english });
      }
    }
    const out: IdiomQuizQ[] = [];
    for (const t of all) {
      const distractors = sampleN(
        all.filter((i) => i.english !== t.english),
        3
      ).map((d) => d.english);
      const choices = shuffle([t.english, ...distractors]);
      out.push({
        kind: "idiom-quiz",
        wordId: t.wordId,
        itemType: "idiom",
        prompt: t.korean,
        choices,
        answer: t.english,
        audioText: t.korean,
      });
    }
    return sampleN(out, Math.min(QUESTION_COUNT, out.length));
  }, [words]);

  return (
    <Runner
      questions={questions}
      renderQ={(q, onAnswer, onNext) => (
        <IdiomQuizRenderer q={q as IdiomQuizQ} onAnswer={onAnswer} onNext={onNext} />
      )}
    />
  );
}
function IdiomQuizRenderer({
  q, onAnswer, onNext,
}: { q: IdiomQuizQ; onAnswer: (c: boolean) => void; onNext: () => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const correct = picked === q.answer;
  const submit = () => { if (submitted) return; setSubmitted(true); onAnswer(correct); };
  return (
    <Card className="border-2">
      <CardContent className="space-y-3 p-6">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">What does this idiom mean?</div>
        <div className="flex items-center gap-2">
          <p className="text-xl font-semibold" lang="ko">{q.prompt}</p>
          <AudioButton text={q.audioText} size="sm" />
        </div>
        <ul className="space-y-2">
          {q.choices.map((c) => {
            const isPicked = picked === c;
            const isCorrect = c === q.answer;
            return (
              <li key={c}>
                <button
                  type="button"
                  disabled={submitted}
                  onClick={() => setPicked(c)}
                  className={
                    "flex w-full items-center justify-between rounded-md border p-2 text-left text-sm transition-colors " +
                    (!submitted
                      ? isPicked
                        ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950"
                        : "hover:bg-accent"
                      : isCorrect
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : isPicked
                          ? "border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : "opacity-60")
                  }
                >
                  {c}
                  {submitted && isCorrect && <CheckIcon className="h-4 w-4" />}
                  {submitted && isPicked && !isCorrect && <XIcon className="h-4 w-4" />}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex gap-2">
          {!submitted ? (
            <Button onClick={submit} disabled={!picked}>
              <CheckIcon className="h-4 w-4" /> Submit
            </Button>
          ) : (
            <NextButton onNext={onNext} correct={correct} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 5. Word matching (single-screen, no per-question Runner)
// ---------------------------------------------------------------------------
function WordMatching({ words }: { words: WordEntry[] }) {
  const [question] = useState(() => {
    const sample = sampleN(words, Math.min(6, words.length));
    return {
      pairs: sample.map((w) => ({ wordId: w.id, korean: w.korean, english: w.english })),
    };
  });
  const [leftSel, setLeftSel] = useState<string | null>(null);
  const [rightSel, setRightSel] = useState<string | null>(null);
  const [matched, setMatched] = useState<Record<string, string>>({});
  const [wrong, setWrong] = useState<{ wordId: string; english: string } | null>(null);

  const shuffledEnglish = useState(() => shuffle(question.pairs.map((p) => p.english)))[0];

  const tryMatch = (wordId: string, english: string) => {
    const correct = question.pairs.find((p) => p.wordId === wordId)?.english === english;
    if (correct) {
      setMatched((m) => ({ ...m, [wordId]: english }));
      setLeftSel(null);
      setRightSel(null);
    } else {
      setWrong({ wordId, english });
      setTimeout(() => setWrong(null), 600);
      setLeftSel(null);
      setRightSel(null);
    }
  };

  // When both sides selected, attempt match
  if (leftSel && rightSel) {
    tryMatch(leftSel, rightSel);
  }

  const allMatched = Object.keys(matched).length === question.pairs.length;
  return (
    <Card className="border-2">
      <CardContent className="space-y-3 p-6">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Match Korean words to their English translations
        </div>
        {allMatched && (
          <div className="rounded-md bg-emerald-100 p-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            All matched! Refresh the page for a new set.
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            {question.pairs.map((p) => {
              const isMatched = !!matched[p.wordId];
              return (
                <button
                  key={p.wordId}
                  type="button"
                  disabled={isMatched}
                  onClick={() => setLeftSel(p.wordId)}
                  className={
                    "w-full rounded-md border p-2 text-sm transition-colors " +
                    (isMatched
                      ? "bg-emerald-50 opacity-50 line-through dark:bg-emerald-950"
                      : leftSel === p.wordId
                        ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950"
                        : wrong?.wordId === p.wordId
                          ? "border-rose-400 bg-rose-50 dark:bg-rose-950"
                          : "hover:bg-accent")
                  }
                  lang="ko"
                >
                  {p.korean}
                </button>
              );
            })}
          </div>
          <div className="space-y-2">
            {shuffledEnglish.map((eng) => {
              const isMatched = Object.values(matched).includes(eng);
              return (
                <button
                  key={eng}
                  type="button"
                  disabled={isMatched}
                  onClick={() => setRightSel(eng)}
                  className={
                    "w-full rounded-md border p-2 text-sm transition-colors " +
                    (isMatched
                      ? "bg-emerald-50 opacity-50 line-through dark:bg-emerald-950"
                      : rightSel === eng
                        ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950"
                        : wrong?.english === eng
                          ? "border-rose-400 bg-rose-50 dark:bg-rose-950"
                          : "hover:bg-accent")
                  }
                >
                  {eng}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 6. Dictation
// ---------------------------------------------------------------------------
function Dictation({ words }: { words: WordEntry[] }) {
  const questions = useMemo<DictationQ[]>(() => {
    const out: DictationQ[] = [];
    for (const w of words) {
      out.push({
        kind: "dictation",
        wordId: w.id,
        itemType: "word",
        audioText: w.korean,
        answer: w.korean,
        english: w.english,
      });
      for (const c of w.chunks) {
        out.push({
          kind: "dictation",
          wordId: w.id,
          itemType: "chunk",
          audioText: c.korean,
          answer: c.korean,
          english: c.english,
        });
      }
    }
    return sampleN(out, QUESTION_COUNT);
  }, [words]);

  return (
    <Runner
      questions={questions}
      renderQ={(q, onAnswer, onNext) => (
        <DictationRenderer q={q as DictationQ} onAnswer={onAnswer} onNext={onNext} />
      )}
    />
  );
}
function DictationRenderer({
  q, onAnswer, onNext,
}: { q: DictationQ; onAnswer: (c: boolean) => void; onNext: () => void }) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const correct = normalizeText(value) === normalizeText(q.answer);
  const submit = () => { if (submitted) return; setSubmitted(true); onAnswer(correct); };
  return (
    <Card className="border-2">
      <CardContent className="space-y-3 p-6">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Listen and write what you hear</div>
        <div className="flex items-center gap-3">
          <AudioButton text={q.audioText} size="default" label="Play" />
          <span className="text-xs text-muted-foreground">
            (Tap play, listen, then type the Korean text.)
          </span>
        </div>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type the Korean you heard"
          lang="ko"
          disabled={submitted}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        {submitted && <Feedback correct={correct} answer={`${q.answer} — ${q.english}`} />}
        <div className="flex gap-2">
          {!submitted ? (
            <Button onClick={submit}><CheckIcon className="h-4 w-4" /> Submit</Button>
          ) : (
            <NextButton onNext={onNext} correct={correct} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

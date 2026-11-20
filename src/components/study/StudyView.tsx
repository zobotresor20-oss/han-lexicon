// han-Lexicon — Study view: menu of activities + SRS dashboard.

"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDbSafe } from "@/lib/db";
import { useAppStore, type StudyActivity } from "@/lib/store";
import { TopBar } from "@/components/common/BottomNav";
import { EmptyState } from "@/components/common/Primitives";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  LayersIcon,
  BrainIcon,
  FileTextIcon,
  PuzzleIcon,
  RepeatIcon,
  ListChecksIcon,
  HeadphonesIcon,
  PenLineIcon,
  CalendarIcon,
  FlameIcon,
  ClockIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  CalendarClockIcon,
} from "lucide-react";

import { FlashcardActivity } from "@/components/study/FlashcardActivity";
import { FreeRecallActivity } from "@/components/study/FreeRecallActivity";
import { ExerciseActivity } from "@/components/study/ExerciseActivity";
import { PersonalProductionActivity } from "@/components/study/PersonalProductionActivity";
import { DailyMiniTextActivity } from "@/components/study/DailyMiniTextActivity";
import { SrsDashboard } from "@/components/study/SrsDashboard";
import { srsBucket } from "@/lib/sm2";

const ACTIVITIES: {
  id: StudyActivity;
  title: string;
  description: string;
  icon: typeof LayersIcon;
  color: string;
}[] = [
  {
    id: "srs-dashboard",
    title: "SRS Dashboard",
    description: "Due today, upcoming, learning, mastered, missed words.",
    icon: CalendarClockIcon,
    color: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "flashcards",
    title: "Flashcards",
    description: "Korean → English or English → Korean. Audio included.",
    icon: LayersIcon,
    color: "text-sky-600 dark:text-sky-400",
  },
  {
    id: "free-recall",
    title: "Free Recall",
    description: "See a word, recall its chunks, collocations, idioms.",
    icon: BrainIcon,
    color: "text-violet-600 dark:text-violet-400",
  },
  {
    id: "fill-blanks",
    title: "Fill in the Blanks",
    description: "Complete Korean sentences with the missing word.",
    icon: FileTextIcon,
    color: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "complete-collocation",
    title: "Complete the Collocation",
    description: "Type the missing word in a collocation.",
    icon: PuzzleIcon,
    color: "text-rose-600 dark:text-rose-400",
  },
  {
    id: "unscramble-chunks",
    title: "Unscramble Chunks",
    description: "Reorder shuffled tokens into the correct chunk.",
    icon: RepeatIcon,
    color: "text-teal-600 dark:text-teal-400",
  },
  {
    id: "idiom-quiz",
    title: "Idiom Quiz",
    description: "Multiple choice on Korean idioms' meanings.",
    icon: ListChecksIcon,
    color: "text-fuchsia-600 dark:text-fuchsia-400",
  },
  {
    id: "word-matching",
    title: "Word Matching",
    description: "Match Korean words to their English translations.",
    icon: ListChecksIcon,
    color: "text-indigo-600 dark:text-indigo-400",
  },
  {
    id: "dictation",
    title: "Listening & Dictation",
    description: "Listen to a Korean word and write what you hear.",
    icon: HeadphonesIcon,
    color: "text-cyan-600 dark:text-cyan-400",
  },
  {
    id: "personal-production",
    title: "Personal Production",
    description: "Write your own Korean sentence from a prompt.",
    icon: PenLineIcon,
    color: "text-orange-600 dark:text-orange-400",
  },
  {
    id: "daily-mini-text",
    title: "Daily Mini Text",
    description: "Write a short Korean text using 3–5 random words.",
    icon: CalendarIcon,
    color: "text-emerald-600 dark:text-emerald-400",
  },
];

export function StudyView() {
  const db = getDbSafe();
  const words = useLiveQuery(
    () => (db ? db.words.toArray() : Promise.resolve([])),
    [db],
    []
  );
  const activity = useAppStore((s) => s.studyActivity);
  const setActivity = useAppStore((s) => s.setStudyActivity);

  const buckets = useMemo(() => {
    const now = Date.now();
    let due = 0, upcoming = 0, learning = 0, mastered = 0, missed = 0;
    for (const w of words) {
      const b = srsBucket(w.srs, now);
      if (b === "due") due++;
      else if (b === "upcoming") upcoming++;
      else if (b === "learning") learning++;
      else if (b === "mastered") mastered++;
      else if (b === "missed") missed++;
    }
    return { due, upcoming, learning, mastered, missed };
  }, [words]);

  // Render the active activity
  if (activity !== "menu") {
    return <ActivityRenderer activity={activity} words={words} onExit={() => setActivity("menu")} />;
  }

  if (words.length === 0) {
    return (
      <div className="min-h-screen pb-32">
        <TopBar title="Study" subtitle="Active learning activities" />
        <div className="mx-auto max-w-3xl px-4 py-4">
          <EmptyState
            icon={<LayersIcon className="h-6 w-6" />}
            title="No vocabulary yet"
            description="Add a few Korean words first, then come back here to study them with flashcards, exercises, and spaced repetition."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <TopBar title="Study" subtitle="Active learning activities" />

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
        {/* SRS summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClockIcon className="h-4 w-4 text-emerald-600" />
              Spaced repetition
            </CardTitle>
            <CardDescription>
              Your review queue at a glance
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-5 gap-2 text-center">
            <Bucket label="Due" value={buckets.due} icon={<ClockIcon className="h-3 w-3" />} color="text-rose-600" />
            <Bucket label="Upcoming" value={buckets.upcoming} icon={<CalendarIcon className="h-3 w-3" />} color="text-sky-600" />
            <Bucket label="Learning" value={buckets.learning} icon={<BrainIcon className="h-3 w-3" />} color="text-amber-600" />
            <Bucket label="Mastered" value={buckets.mastered} icon={<CheckCircle2Icon className="h-3 w-3" />} color="text-emerald-600" />
            <Bucket label="Missed" value={buckets.missed} icon={<AlertCircleIcon className="h-3 w-3" />} color="text-rose-600" />
          </CardContent>
        </Card>

        {/* Daily goal teaser */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FlameIcon className="h-4 w-4 text-orange-500" />
              Today&apos;s goal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DailyGoalBar />
          </CardContent>
        </Card>

        {/* Activities grid */}
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Activities
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {ACTIVITIES.map((a) => {
              const Icon = a.icon;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setActivity(a.id)}
                    className="group w-full rounded-lg border bg-card p-3 text-left transition-all hover:border-emerald-400 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`mt-0.5 h-5 w-5 ${a.color}`} />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{a.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {a.description}
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Bucket({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-md bg-muted/50 p-2">
      <div className={`mx-auto mb-0.5 flex items-center justify-center gap-1 text-[10px] font-semibold uppercase ${color}`}>
        {icon}
        {label}
      </div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

function DailyGoalBar() {
  const settings = useAppStore((s) => s.settings);
  const db = getDbSafe();
  const todayStat = useLiveQuery(async () => {
    if (!db) return null;
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return db.dailyStats.get(key);
  }, [db]);
  const newWordsPct = Math.min(100, ((todayStat?.newWords ?? 0) / Math.max(1, settings.dailyNewWordsGoal)) * 100);
  const reviewsPct = Math.min(100, ((todayStat?.reviewsDone ?? 0) / Math.max(1, settings.dailyReviewsGoal)) * 100);
  return (
    <div className="space-y-2">
      <div>
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-muted-foreground">New words</span>
          <span className="font-medium">
            {todayStat?.newWords ?? 0} / {settings.dailyNewWordsGoal}
          </span>
        </div>
        <Progress value={newWordsPct} className="h-2" />
      </div>
      <div>
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-muted-foreground">Reviews</span>
          <span className="font-medium">
            {todayStat?.reviewsDone ?? 0} / {settings.dailyReviewsGoal}
          </span>
        </div>
        <Progress value={reviewsPct} className="h-2" />
      </div>
    </div>
  );
}

function ActivityRenderer({
  activity,
  words,
  onExit,
}: {
  activity: StudyActivity;
  words: import("@/lib/types").WordEntry[];
  onExit: () => void;
}) {
  switch (activity) {
    case "srs-dashboard":
      return <SrsDashboard words={words} onExit={onExit} />;
    case "flashcards":
      return <FlashcardActivity words={words} onExit={onExit} />;
    case "free-recall":
      return <FreeRecallActivity words={words} onExit={onExit} />;
    case "fill-blanks":
    case "complete-collocation":
    case "unscramble-chunks":
    case "idiom-quiz":
    case "word-matching":
    case "dictation":
      return (
        <ExerciseActivity
          type={activity}
          words={words}
          onExit={onExit}
        />
      );
    case "personal-production":
      return <PersonalProductionActivity words={words} onExit={onExit} />;
    case "daily-mini-text":
      return <DailyMiniTextActivity words={words} onExit={onExit} />;
    default:
      return null;
  }
}

// han-Lexicon — Statistics dashboard with recharts visualizations.

"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpenIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  BrainIcon,
  TrophyIcon,
  MicOffIcon,
  TargetIcon,
  ClockIcon,
  FlameIcon,
  CalendarDaysIcon,
  SparklesIcon,
  TrendingUpIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { TopBar } from "@/components/common/BottomNav";
import { EmptyState } from "@/components/common/Primitives";
import { AudioButton } from "@/components/common/AudioButton";
import {
  computeDashboard,
  getAllDailyStats,
  getVocabularyGrowth,
  getMasteredGrowth,
  getAccuracyOverTime,
  getWordOfTheDay,
} from "@/lib/stats";
import { formatDuration } from "@/lib/utils-han";
import type { DashboardStats, DailyStat } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import type { WordEntry } from "@/lib/types";

export function StatisticsView() {
  const settings = useAppStore((s) => s.settings);
  const navigateToWord = useAppStore((s) => s.navigateToWord);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [vocabGrowth, setVocabGrowth] = useState<{ date: string; total: number }[]>([]);
  const [masteredGrowth, setMasteredGrowth] = useState<{ date: string; total: number }[]>([]);
  const [accuracy, setAccuracy] = useState<{ date: string; accuracy: number }[]>([]);
  const [wordOfTheDay, setWordOfTheDay] = useState<WordEntry | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [s, daily, vg, mg, acc, wotd] = await Promise.all([
        computeDashboard(settings.dailyNewWordsGoal, settings.dailyReviewsGoal),
        getAllDailyStats(),
        getVocabularyGrowth(),
        getMasteredGrowth(),
        getAccuracyOverTime(),
        getWordOfTheDay(),
      ]);
      if (cancelled) return;
      setStats(s);
      setDailyStats(daily);
      setVocabGrowth(vg);
      setMasteredGrowth(mg);
      setAccuracy(acc);
      setWordOfTheDay(wotd);
    })();
    return () => { cancelled = true; };
  }, [settings.dailyNewWordsGoal, settings.dailyReviewsGoal]);

  if (!stats) {
    return (
      <div className="min-h-screen pb-32">
        <TopBar title="Statistics" subtitle="Your learning progress" />
        <div className="mx-auto max-w-3xl space-y-3 px-4 py-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const dailyChartData = dailyStats.map((d) => ({
    date: d.date.slice(5), // MM-DD
    reviews: d.reviewsDone,
    newWords: d.newWords,
    studyMin: Math.round(d.studyTimeMs / 60000),
  }));

  return (
    <div className="min-h-screen pb-32">
      <TopBar title="Statistics" subtitle="Your learning progress" />

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Kpi label="Total entries" value={stats.totalEntries} icon={<BookOpenIcon className="h-4 w-4" />} />
          <Kpi label="Complete" value={stats.completeEntries} icon={<CheckCircle2Icon className="h-4 w-4" />} color="text-sky-600" />
          <Kpi label="Incomplete" value={stats.incompleteEntries} icon={<AlertCircleIcon className="h-4 w-4" />} color="text-rose-600" />
          <Kpi label="Learning" value={stats.learningEntries} icon={<BrainIcon className="h-4 w-4" />} color="text-amber-600" />
          <Kpi label="Mastered" value={stats.masteredEntries} icon={<TrophyIcon className="h-4 w-4" />} color="text-emerald-600" />
          <Kpi label="Without IPA" value={stats.itemsWithoutPronunciation} icon={<MicOffIcon className="h-4 w-4" />} />
          <Kpi
            label="Overall accuracy"
            value={`${Math.round(stats.overallAccuracy * 100)}%`}
            icon={<TargetIcon className="h-4 w-4" />}
            color="text-emerald-600"
          />
          <Kpi
            label="Study time"
            value={formatDuration(stats.totalStudyTimeMs)}
            icon={<ClockIcon className="h-4 w-4" />}
          />
          <Kpi
            label="Current streak"
            value={`${stats.currentStreak}d`}
            icon={<FlameIcon className="h-4 w-4" />}
            color="text-orange-600"
          />
          <Kpi
            label="Longest streak"
            value={`${stats.longestStreak}d`}
            icon={<CalendarDaysIcon className="h-4 w-4" />}
          />
          <Kpi label="Due today" value={stats.dueToday} icon={<ClockIcon className="h-4 w-4" />} color="text-rose-600" />
          <Kpi label="Missed" value={stats.missed} icon={<AlertCircleIcon className="h-4 w-4" />} color="text-rose-600" />
        </div>

        {/* Daily goals */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TargetIcon className="h-4 w-4 text-emerald-600" />
              Daily goals
            </CardTitle>
            <CardDescription>Today&apos;s progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted-foreground">New words</span>
                <span className="font-medium">
                  {stats.dailyNewWordsProgress} / {stats.dailyNewWordsGoal}
                </span>
              </div>
              <Progress
                value={Math.min(100, (stats.dailyNewWordsProgress / Math.max(1, stats.dailyNewWordsGoal)) * 100)}
                className="h-2"
              />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted-foreground">Reviews</span>
                <span className="font-medium">
                  {stats.dailyReviewsProgress} / {stats.dailyReviewsGoal}
                </span>
              </div>
              <Progress
                value={Math.min(100, (stats.dailyReviewsProgress / Math.max(1, stats.dailyReviewsGoal)) * 100)}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Word of the day */}
        {wordOfTheDay && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <SparklesIcon className="h-4 w-4 text-violet-600" />
                Word of the day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <button
                type="button"
                onClick={() => navigateToWord(wordOfTheDay.id)}
                className="flex items-center gap-3 text-left"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold" lang="ko">
                      {wordOfTheDay.korean}
                    </span>
                    <AudioButton text={wordOfTheDay.korean} size="sm" />
                  </div>
                  <div className="text-sm text-muted-foreground">{wordOfTheDay.english}</div>
                </div>
              </button>
            </CardContent>
          </Card>
        )}

        {/* Vocabulary growth */}
        <ChartCard
          title="Vocabulary growth"
          subtitle="Cumulative words over time"
          icon={<TrendingUpIcon className="h-4 w-4" />}
          empty={vocabGrowth.length === 0}
        >
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={vocabGrowth}>
              <defs>
                <linearGradient id="g-vocab" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#88888830" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#g-vocab)"
                name="Words"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Daily activity */}
        <ChartCard
          title="Daily study activity"
          subtitle="Reviews and new words per day"
          icon={<BarChart className="h-4 w-4" />}
          empty={dailyChartData.length === 0}
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyChartData.slice(-30)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#88888830" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="reviews" fill="#0ea5e9" name="Reviews" radius={[3, 3, 0, 0]} />
              <Bar dataKey="newWords" fill="#f59e0b" name="New words" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Accuracy over time */}
        <ChartCard
          title="Accuracy over time"
          subtitle="Per-day review accuracy"
          icon={<TargetIcon className="h-4 w-4" />}
          empty={accuracy.length === 0}
        >
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={accuracy}>
              <CartesianGrid strokeDasharray="3 3" stroke="#88888830" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                  fontSize: 12,
                }}
                formatter={(v: number) => `${Math.round(v * 100)}%`}
              />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Accuracy"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Mastered growth */}
        <ChartCard
          title="Mastered vocabulary"
          subtitle="Cumulative mastered words over time"
          icon={<TrophyIcon className="h-4 w-4" />}
          empty={masteredGrowth.length === 0}
        >
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={masteredGrowth}>
              <defs>
                <linearGradient id="g-mastered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#88888830" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#g-mastered)"
                name="Mastered"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {stats.totalEntries === 0 && (
          <EmptyState
            icon={<BookOpenIcon className="h-6 w-6" />}
            title="No data yet"
            description="Add a few words and start studying to populate your statistics."
          />
        )}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  color = "text-foreground",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className={`mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ${color}`}>
        {icon}
        {label}
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  icon,
  empty,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  empty?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="text-emerald-600 dark:text-emerald-400">{icon}</span>
          {title}
        </CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        {empty ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No data yet — start studying to fill this chart.
          </p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

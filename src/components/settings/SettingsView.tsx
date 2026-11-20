// han-Lexicon — Settings view: theme, font scale, daily goals, IPA hiding,
// speech rate, daily reminder, JSON backup / restore, CSV export,
// re-seed demo data, clear all data.

"use client";

import { useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  PaletteIcon,
  TypeIcon,
  TargetIcon,
  MicIcon,
  BellIcon,
  DownloadIcon,
  UploadIcon,
  FileSpreadsheetIcon,
  DatabaseIcon,
  Trash2Icon,
  AlertTriangleIcon,
} from "lucide-react";
import { TopBar } from "@/components/common/BottomNav";
import { useAppStore } from "@/lib/store";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { exportJsonBackup, exportCsv, validateBackup, restoreJsonBackup } from "@/lib/export";
import { clearAllData } from "@/lib/crud";
import { seedDemoDataIfNeeded } from "@/lib/demo-data";
import { getDb } from "@/lib/db";

export function SettingsView() {
  const settings = useAppStore((s) => s.settings);
  const update = useAppStore((s) => s.updateSettings);
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [restorePreview, setRestorePreview] = useState<{ text: string; counts: { words: number; reviewLogs: number; dailyStats: number; searchHistory: number } } | null>(null);

  // Apply font scale to <html> font-size
  const fontScaleClass =
    settings.fontScale === "sm"
      ? "text-[14px]"
      : settings.fontScale === "lg"
        ? "text-[18px]"
        : settings.fontScale === "xl"
          ? "text-[20px]"
          : "text-[16px]";

  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Notifications are not supported in this browser.");
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      toast.success("Notifications enabled.");
      scheduleDailyReminder(settings.reminderHour, settings.reminderMinute);
    } else {
      toast.error("Notification permission was denied.");
    }
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    const result = validateBackup(text);
    if (!result.ok) {
      toast.error(result.errors.join(" "));
      return;
    }
    setRestorePreview({ text, counts: result.counts! });
  };

  const handleRestore = async () => {
    if (!restorePreview) return;
    const result = await restoreJsonBackup(restorePreview.text);
    if (!result.ok) {
      toast.error(result.errors.join(" "));
      return;
    }
    toast.success(`Restored ${result.counts?.words ?? 0} words.`);
    setRestorePreview(null);
  };

  return (
    <div className={`min-h-screen pb-32 ${fontScaleClass}`}>
      <TopBar title="Settings" subtitle="Personalize han-Lexicon" />
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PaletteIcon className="h-4 w-4 text-emerald-600" />
              Appearance
            </CardTitle>
            <CardDescription>Theme and typography</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <Label className="text-xs">Theme</Label>
              <Select
                value={theme ?? "system"}
                onValueChange={(v) => setTheme(v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Font size</Label>
              <Select
                value={settings.fontScale}
                onValueChange={(v) => update({ fontScale: v as typeof settings.fontScale })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                  <SelectItem value="xl">Extra large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Daily goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TargetIcon className="h-4 w-4 text-emerald-600" />
              Daily goals
            </CardTitle>
            <CardDescription>Targets that drive the progress bar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <Label className="text-xs">New words per day</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={settings.dailyNewWordsGoal}
                onChange={(e) =>
                  update({ dailyNewWordsGoal: Math.max(0, Number(e.target.value) || 0) })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Reviews per day</Label>
              <Input
                type="number"
                min={0}
                max={500}
                value={settings.dailyReviewsGoal}
                onChange={(e) =>
                  update({ dailyReviewsGoal: Math.max(0, Number(e.target.value) || 0) })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Exercises & pronunciation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MicIcon className="h-4 w-4 text-emerald-600" />
              Exercises & pronunciation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label className="text-xs">Hide pronunciation during exercises</Label>
                <p className="text-[11px] text-muted-foreground">
                  Hide the IPA in flashcards, free recall, dictation and gap-fills.
                  A reveal button stays available at any time.
                </p>
              </div>
              <Switch
                checked={settings.hidePronunciationDuringExercises}
                onCheckedChange={(v) => update({ hidePronunciationDuringExercises: v })}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label className="text-xs">Prefer Korean native voice</Label>
                <p className="text-[11px] text-muted-foreground">
                  Prefer a localService Korean voice when available.
                </p>
              </div>
              <Switch
                checked={settings.preferKoreanNativeVoice}
                onCheckedChange={(v) => update({ preferKoreanNativeVoice: v })}
              />
            </div>
            <div className="grid gap-2 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Speech rate</Label>
                <span className="text-xs text-muted-foreground">
                  {settings.speechRate.toFixed(1)}×
                </span>
              </div>
              <Slider
                min={0.5}
                max={1.5}
                step={0.1}
                value={[settings.speechRate]}
                onValueChange={(v) => update({ speechRate: v[0] })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Daily reminder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BellIcon className="h-4 w-4 text-emerald-600" />
              Daily reminder
            </CardTitle>
            <CardDescription>Local notifications only — no remote service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label className="text-xs">Enable daily reminder</Label>
              <Switch
                checked={settings.reminderEnabled}
                onCheckedChange={(v) => {
                  update({ reminderEnabled: v });
                  if (v) requestNotificationPermission();
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label className="text-xs">Hour</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={settings.reminderHour}
                  onChange={(e) => {
                    const h = Math.min(23, Math.max(0, Number(e.target.value) || 0));
                    update({ reminderHour: h });
                    if (settings.reminderEnabled) scheduleDailyReminder(h, settings.reminderMinute);
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Minute</Label>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={settings.reminderMinute}
                  onChange={(e) => {
                    const m = Math.min(59, Math.max(0, Number(e.target.value) || 0));
                    update({ reminderMinute: m });
                    if (settings.reminderEnabled) scheduleDailyReminder(settings.reminderHour, m);
                  }}
                />
              </div>
            </div>
            {settings.reminderEnabled && (
              <p className="text-[11px] text-muted-foreground">
                The reminder fires when the app is open in your browser or installed as a PWA.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Backup & restore */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DownloadIcon className="h-4 w-4 text-emerald-600" />
              Backup & restore
            </CardTitle>
            <CardDescription>
              All data stays on this device. Export regularly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => exportJsonBackup(settings)}
              >
                <DownloadIcon className="h-4 w-4" /> Export JSON backup
              </Button>
              <Button variant="outline" onClick={() => exportCsv()}>
                <FileSpreadsheetIcon className="h-4 w-4" /> Export CSV
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <UploadIcon className="h-4 w-4" /> Restore from JSON
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
            </div>
            {restorePreview && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
                <div className="mb-1 flex items-center gap-1.5 font-semibold">
                  <AlertTriangleIcon className="h-4 w-4" /> Restore confirmation
                </div>
                <p className="mb-2">
                  This will <strong>wipe your current data</strong> and restore{" "}
                  <strong>{restorePreview.counts.words}</strong> words,{" "}
                  {restorePreview.counts.reviewLogs} review logs,{" "}
                  {restorePreview.counts.dailyStats} daily stats,{" "}
                  {restorePreview.counts.searchHistory} search history entries.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleRestore}>
                    Confirm restore
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setRestorePreview(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DatabaseIcon className="h-4 w-4 text-emerald-600" />
              Data management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  const n = await seedDemoDataIfNeeded(true);
                  toast.success(`Re-seeded ${n} demo entries.`);
                }}
              >
                <DatabaseIcon className="h-4 w-4" /> Re-seed demo data
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-rose-600">
                    <Trash2Icon className="h-4 w-4" /> Clear all data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete everything?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently deletes all words, review logs, statistics,
                      and search history stored on this device. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-rose-600 hover:bg-rose-700"
                      onClick={async () => {
                        await clearAllData();
                        toast.success("All data cleared.");
                      }}
                    >
                      Delete everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <p className="text-[11px] text-muted-foreground">
              About han-Lexicon: a personal Korean–English dictionary and active
              learning PWA. v1. No account, no cloud, no telemetry.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Schedule a daily reminder using setTimeout while the app is open.
// (Web Notifications don't have a true "schedule"; we approximate with
// a timer that re-checks every minute.)
let reminderTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleDailyReminder(hour: number, minute: number) {
  if (reminderTimer) clearTimeout(reminderTimer);
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  const delay = next.getTime() - now.getTime();
  reminderTimer = setTimeout(() => {
    try {
      new Notification("han-Lexicon", {
        body: "Time for your daily Korean review!",
        icon: "/icon-192.png",
      });
    } catch {}
    // Schedule next day
    scheduleDailyReminder(hour, minute);
  }, delay);
}

// han-Lexicon — main app shell.
// Single route (`/`) per sandbox constraint. Tab navigation switches views
// via Zustand state. PWA install prompt and demo data seeding are wired here.

"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { BottomNav } from "@/components/common/BottomNav";
import { DictionaryView } from "@/components/dictionary/DictionaryView";
import { SearchView } from "@/components/search/SearchView";
import { StudyView } from "@/components/study/StudyView";
import { StatisticsView } from "@/components/statistics/StatisticsView";
import { SettingsView } from "@/components/settings/SettingsView";
import { WordFormDialog } from "@/components/dictionary/WordForm";
import { seedDemoDataIfNeeded } from "@/lib/demo-data";
import { scheduleDailyReminder } from "@/components/settings/SettingsView";
import { useLiveQuery } from "dexie-react-hooks";
import { getDbSafe } from "@/lib/db";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const activeTab = useAppStore((s) => s.activeTab);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const setInstallPromptAvailable = useAppStore((s) => s.setInstallPromptAvailable);
  const setIsInstalled = useAppStore((s) => s.setIsInstalled);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  // Bootstrap: seed demo data once, register install handler, schedule reminder
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Wait for the db to be available (browser only)
      const db = getDbSafe();
      if (!db) return;
      // Seed demo data only on very first launch
      if (!settings.demoDataSeeded) {
        const n = await seedDemoDataIfNeeded(false);
        if (n > 0) {
          updateSettings({ demoDataSeeded: true });
        } else {
          // Already has data — mark as seeded so we don't keep trying
          updateSettings({ demoDataSeeded: true });
        }
      }
      if (cancelled) return;
      setBootstrapped(true);

      // PWA install prompt capture
      const onBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallPromptAvailable(true);
      };
      const onAppInstalled = () => setIsInstalled(true);
      window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.addEventListener("appinstalled", onAppInstalled);
      return () => {
        window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
        window.removeEventListener("appinstalled", onAppInstalled);
      };
    })();
    return () => { cancelled = true; };
  }, [settings.demoDataSeeded, updateSettings, setInstallPromptAvailable, setIsInstalled]);

  // Schedule daily reminder on load if enabled
  useEffect(() => {
    if (settings.reminderEnabled) {
      scheduleDailyReminder(settings.reminderHour, settings.reminderMinute);
    }
  }, [settings.reminderEnabled, settings.reminderHour, settings.reminderMinute]);

  // Block rendering until bootstrap completes to avoid hydration flashes
  // around IndexedDB data (the demo seeding happens once on first launch).
  const db = getDbSafe();
  const wordCount = useLiveQuery(
    () => (db ? db.words.count() : Promise.resolve(0)),
    [db],
    -1
  );

  if (!bootstrapped || wordCount === -1) {
    return (
      <div className="min-h-screen p-6">
        <Skeleton className="mb-3 h-12 w-1/2" />
        <Skeleton className="mb-2 h-24 w-full" />
        <Skeleton className="mb-2 h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen">
        {activeTab === "dictionary" && <DictionaryView />}
        {activeTab === "search" && <SearchView />}
        {activeTab === "study" && <StudyView />}
        {activeTab === "statistics" && <StatisticsView />}
        {activeTab === "settings" && <SettingsView />}
      </main>

      {/* Global floating add button target: the BottomNav renders the FAB
          and calls onAddWord. We just supply the dialog. */}
      <BottomNav onAddWord={() => setAddDialogOpen(true)} />

      <WordFormDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
    </>
  );
}

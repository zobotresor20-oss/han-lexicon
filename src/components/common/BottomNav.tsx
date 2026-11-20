// han-Lexicon — Bottom navigation (5 tabs) + floating add button.

"use client";

import {
  BookOpenIcon,
  SearchIcon,
  GraduationCapIcon,
  BarChart3Icon,
  SettingsIcon,
  PlusIcon,
} from "lucide-react";
import { useAppStore, type MainTab } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TABS: { id: MainTab; label: string; icon: typeof BookOpenIcon }[] = [
  { id: "dictionary", label: "Dictionary", icon: BookOpenIcon },
  { id: "search", label: "Search", icon: SearchIcon },
  { id: "study", label: "Study", icon: GraduationCapIcon },
  { id: "statistics", label: "Statistics", icon: BarChart3Icon },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

interface Props {
  onAddWord: () => void;
}

export function BottomNav({ onAddWord }: Props) {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  return (
    <>
      {/* Floating Add Button — bottom-right, above the bottom nav */}
      <button
        type="button"
        onClick={onAddWord}
        aria-label="Add a new word"
        className="fixed right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 transition-transform hover:scale-105 active:scale-95"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5rem)" }}
      >
        <PlusIcon className="h-6 w-6" />
      </button>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="Primary"
      >
        <div className="mx-auto grid max-w-3xl grid-cols-5">
          {TABS.map((t) => {
            const active = activeTab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors sm:text-xs",
                  active
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    active && "scale-110"
                  )}
                />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          han-Lexicon
        </div>
      </div>
    </header>
  );
}

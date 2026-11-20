// han-Lexicon — Small shared primitives used across views.

"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { EntryStatus, PartOfSpeech } from "@/lib/types";
import { statusBg } from "@/lib/utils-han";
import { ALL_PARTS_OF_SPEECH } from "@/lib/types";

export function StatusBadge({ status }: { status: EntryStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        statusBg(status)
      )}
    >
      {status}
    </span>
  );
}

const POS_LABELS: Record<PartOfSpeech, string> = {
  noun: "noun",
  verb: "verb",
  adjective: "adj.",
  adverb: "adv.",
  particle: "particle",
  conjunction: "conj.",
  interjection: "interj.",
  expression: "expr.",
  pronoun: "pron.",
  number: "num.",
  counter: "counter",
  determiner: "det.",
  other: "other",
};

export function PosBadge({ pos }: { pos: PartOfSpeech }) {
  return (
    <Badge variant="outline" className="text-[10px] font-normal">
      {POS_LABELS[pos] ?? pos}
    </Badge>
  );
}

export { ALL_PARTS_OF_SPEECH };

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon && (
        <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <div>
        <h3 className="text-base font-medium">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// Ipa text with reveal affordance; respects hidePronunciationDuringExercises
// when `hidden` is true (controlled by the parent).
export function IpaText({
  ipa,
  hidden,
  onReveal,
}: {
  ipa?: string;
  hidden?: boolean;
  onReveal?: () => void;
}) {
  if (!ipa) return null;
  if (hidden) {
    return (
      <button
        type="button"
        onClick={onReveal}
        className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        reveal IPA
      </button>
    );
  }
  return <span className="font-mono text-sm text-muted-foreground">/{ipa}/</span>;
}

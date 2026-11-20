// han-Lexicon — Read-only word detail panel (full lexical card view).
// Editing happens via WordFormDialog opened from this view.

"use client";

import {
  ArrowLeftIcon,
  PencilIcon,
  Volume2Icon,
  TagIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/common/BottomNav";
import {
  PosBadge,
  StatusBadge,
  EmptyState,
  IpaText,
} from "@/components/common/Primitives";
import { AudioButton } from "@/components/common/AudioButton";
import { validateEntry, formatDate } from "@/lib/utils-han";
import type { WordEntry } from "@/lib/types";

interface Props {
  word: WordEntry;
  onBack: () => void;
  onEdit: () => void;
}

export function WordDetail({ word, onBack, onEdit }: Props) {
  const report = validateEntry(word);
  return (
    <div className="min-h-screen pb-32">
      <TopBar title="Word detail" subtitle={word.korean} />
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeftIcon className="h-4 w-4" /> Back
          </Button>
          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <PencilIcon className="h-4 w-4" /> Edit
            </Button>
          </div>
        </div>

        {/* Header card */}
        <section className="rounded-lg border bg-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-bold" lang="ko">
              {word.korean}
            </h2>
            <AudioButton text={word.korean} size="default" />
            <PosBadge pos={word.partOfSpeech} />
            <StatusBadge status={report.status} />
          </div>
          <div className="mt-1 text-lg text-muted-foreground">{word.english}</div>
          {word.romanization && (
            <div className="text-sm italic text-muted-foreground">
              {word.romanization}
            </div>
          )}
          {word.ipa && (
            <div className="mt-1 font-mono text-sm text-muted-foreground">
              /{word.ipa}/
            </div>
          )}
          {word.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <TagIcon className="h-3 w-3 text-muted-foreground" />
              {word.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 text-[11px] text-muted-foreground">
            Created {formatDate(word.createdAt)} · Updated {formatDate(word.updatedAt)}
          </div>
          <div className="mt-2 text-xs font-medium text-muted-foreground">
            {report.message}
          </div>
        </section>

        {word.usageContext && (
          <SectionCard title="Usage context">
            <p className="text-sm">{word.usageContext}</p>
          </SectionCard>
        )}

        {word.notes && (
          <SectionCard title="Personal notes">
            <p className="text-sm whitespace-pre-wrap">{word.notes}</p>
          </SectionCard>
        )}

        {word.chunks.length > 0 && (
          <SectionCard title="Chunks">
            <ul className="space-y-2">
              {word.chunks.map((c) => (
                <SubItemRow
                  key={c.id}
                  korean={c.korean}
                  english={c.english}
                  ipa={c.ipa}
                  examples={c.examples}
                />
              ))}
            </ul>
          </SectionCard>
        )}

        {word.collocations.length > 0 && (
          <SectionCard title="Collocations">
            <ul className="space-y-2">
              {word.collocations.map((c) => (
                <SubItemRow
                  key={c.id}
                  korean={c.korean}
                  english={c.english}
                  ipa={c.ipa}
                  examples={c.examples}
                />
              ))}
            </ul>
          </SectionCard>
        )}

        {word.idioms.length > 0 && (
          <SectionCard title="Idiomatic expressions">
            <ul className="space-y-2">
              {word.idioms.map((i) => (
                <SubItemRow
                  key={i.id}
                  korean={i.korean}
                  english={i.english}
                  ipa={i.ipa}
                  examples={i.examples}
                />
              ))}
            </ul>
          </SectionCard>
        )}

        {word.examples.length > 0 && (
          <SectionCard title="Example sentences">
            <ul className="space-y-2">
              {word.examples.map((e) => (
                <ExampleRow key={e.id} korean={e.korean} english={e.english} ipa={e.ipa} note={e.note} />
              ))}
            </ul>
          </SectionCard>
        )}

        {report.status === "incomplete" && (
          <div className="rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
            {report.message}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function SubItemRow({
  korean,
  english,
  ipa,
  examples,
}: {
  korean: string;
  english: string;
  ipa?: string;
  examples: { id: string; korean: string; english: string; ipa?: string; note?: string }[];
}) {
  return (
    <li className="rounded-md border bg-background p-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium" lang="ko">{korean}</span>
        <AudioButton text={korean} size="sm" />
        <span className="text-sm text-muted-foreground">{english}</span>
        {ipa && <IpaText ipa={ipa} />}
      </div>
      {examples.length > 0 && (
        <ul className="mt-1 space-y-1 border-l-2 pl-2">
          {examples.map((e) => (
            <li key={e.id} className="text-xs">
              <div className="flex items-center gap-1.5">
                <span lang="ko">{e.korean}</span>
                <AudioButton text={e.korean} size="sm" />
              </div>
              <div className="text-muted-foreground">{e.english}</div>
              {e.ipa && <IpaText ipa={e.ipa} />}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function ExampleRow({
  korean,
  english,
  ipa,
  note,
}: {
  korean: string;
  english: string;
  ipa?: string;
  note?: string;
}) {
  return (
    <li className="rounded-md border bg-background p-2">
      <div className="flex items-center gap-2">
        <span lang="ko">{korean}</span>
        <AudioButton text={korean} size="sm" />
      </div>
      <div className="text-sm text-muted-foreground">{english}</div>
      {ipa && <IpaText ipa={ipa} />}
      {note && <div className="mt-1 text-xs italic text-muted-foreground">{note}</div>}
    </li>
  );
}

// Export an icon for use elsewhere
export { Volume2Icon };
export type { Props as WordDetailProps };

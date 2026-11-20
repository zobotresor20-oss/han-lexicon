// han-Lexicon — Full create / edit form for a word entry, with nested
// editors for chunks, collocations, idioms, and example sentences.

"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  PlusIcon,
  Trash2Icon,
  PencilIcon,
  XIcon,
  CheckIcon,
  AlertCircleIcon,
  ChevronDownIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  createWord,
  updateWord,
  addChunk,
  updateChunk,
  deleteChunk,
  addCollocation,
  updateCollocation,
  deleteCollocation,
  addIdiom,
  updateIdiom,
  deleteIdiom,
  addExample,
  updateExample,
  deleteExample,
} from "@/lib/crud";
import { MIN_CHUNKS, MIN_COLLOCATIONS, MIN_IDIOMS, type WordEntry, type PartOfSpeech, type ExampleSentence } from "@/lib/types";
import { ALL_PARTS_OF_SPEECH } from "@/lib/types";
import { validateEntry, uid } from "@/lib/utils-han";
import { IpaKeyboard, insertIntoValue } from "@/components/common/IpaKeyboard";
import { AudioButton } from "@/components/common/AudioButton";
import { StatusBadge } from "@/components/common/Primitives";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** When set, edit mode; when undefined, create mode. */
  word?: WordEntry;
}

export function WordFormDialog({ open, onOpenChange, word }: Props) {
  const isEdit = !!word;

  // ----- top-level word fields (only used for create; edit happens in place) -----
  const [korean, setKorean] = useState("");
  const [english, setEnglish] = useState("");
  const [romanization, setRomanization] = useState("");
  const [ipa, setIpa] = useState("");
  const [pos, setPos] = useState<PartOfSpeech>("noun");
  const [usageContext, setUsageContext] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (!open) return;
    if (word) {
      setKorean(word.korean);
      setEnglish(word.english);
      setRomanization(word.romanization ?? "");
      setIpa(word.ipa ?? "");
      setPos(word.partOfSpeech);
      setUsageContext(word.usageContext ?? "");
      setNotes(word.notes ?? "");
      setTags(word.tags.join(", "));
    } else {
      setKorean("");
      setEnglish("");
      setRomanization("");
      setIpa("");
      setPos("noun");
      setUsageContext("");
      setNotes("");
      setTags("");
    }
  }, [open, word]);

  const handleSaveTopLevel = async () => {
    if (!korean.trim() || !english.trim()) {
      toast.error("Korean word and English translation are required.");
      return;
    }
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      if (isEdit && word) {
        await updateWord(word.id, {
          korean,
          english,
          romanization,
          ipa,
          partOfSpeech: pos,
          usageContext,
          notes,
          tags: tagList,
        });
        toast.success("Word updated.");
      } else {
        const id = await createWord({
          korean,
          english,
          romanization,
          ipa,
          partOfSpeech: pos,
          usageContext,
          notes,
          tags: tagList,
        });
        toast.success("Word created.");
        // Re-open the dialog in edit mode for the freshly created word
        // by closing it and navigating; the parent will refresh.
        if (id) {
          onOpenChange(false);
          return;
        }
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(`Could not save: ${(e as Error).message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit word" : "New word"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the main fields. Sub-elements are edited below."
              : "Add a new Korean word to your personal dictionary."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="w-korean">Korean word *</Label>
            <Input
              id="w-korean"
              value={korean}
              onChange={(e) => setKorean(e.target.value)}
              placeholder="예: 사랑"
              lang="ko"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="w-english">English translation *</Label>
            <Input
              id="w-english"
              value={english}
              onChange={(e) => setEnglish(e.target.value)}
              placeholder="e.g. love"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="w-roman">Romanization</Label>
              <Input
                id="w-roman"
                value={romanization}
                onChange={(e) => setRomanization(e.target.value)}
                placeholder="e.g. sarang"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="w-pos">Part of speech</Label>
              <Select
                value={pos}
                onValueChange={(v) => setPos(v as PartOfSpeech)}
              >
                <SelectTrigger id="w-pos">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_PARTS_OF_SPEECH.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="w-ipa">Pronunciation (IPA)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="w-ipa"
                value={ipa}
                onChange={(e) => setIpa(e.target.value)}
                placeholder="e.g. sa.ɾaŋ"
                className="font-mono"
              />
              <IpaKeyboard
                onInsert={(sym) => {
                  const el = document.getElementById("w-ipa") as HTMLInputElement | null;
                  if (!el) {
                    setIpa(ipa + sym);
                    return;
                  }
                  const pos = el.selectionStart ?? ipa.length;
                  const { value: next, pos: np } = insertIntoValue(ipa, sym, pos);
                  setIpa(next);
                  requestAnimationFrame(() => {
                    el.focus();
                    el.setSelectionRange(np, np);
                  });
                }}
              />
              {ipa && (
                <AudioButton text={korean || "?"} size="icon" />
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="w-usage">Usage context</Label>
            <Textarea
              id="w-usage"
              value={usageContext}
              onChange={(e) => setUsageContext(e.target.value)}
              placeholder="When and where is this word used? Register, situation, circumstances..."
              rows={2}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="w-notes">Personal notes</Label>
            <Textarea
              id="w-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything you want to remember about this word."
              rows={2}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="w-tags">Tags (comma-separated)</Label>
            <Input
              id="w-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. emotion, core, daily"
            />
          </div>

          {isEdit && word && (
            <SubElementsEditor word={word} />
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleSaveTopLevel}>
            <CheckIcon className="mr-1 h-4 w-4" />
            {isEdit ? "Save word" : "Create word"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Sub-elements editor: chunks, collocations, idioms, examples
// ---------------------------------------------------------------------------
function SubElementsEditor({ word }: { word: WordEntry }) {
  const report = validateEntry(word);
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-sm font-medium">Sub-elements</div>
        <div className="flex items-center gap-2">
          <StatusBadge status={report.status} />
          <span className="text-xs text-muted-foreground">{report.message}</span>
        </div>
      </div>

      <Accordion type="multiple" className="w-full">
        <AccordionItem value="chunks">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              Chunks
              <CountPill count={word.chunks.length} min={MIN_CHUNKS} />
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <SubList
              word={word}
              kind="chunks"
              addFn={addChunk}
              updateFn={updateChunk}
              deleteFn={deleteChunk}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="collocations">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              Collocations
              <CountPill count={word.collocations.length} min={MIN_COLLOCATIONS} />
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <SubList
              word={word}
              kind="collocations"
              addFn={addCollocation}
              updateFn={updateCollocation}
              deleteFn={deleteCollocation}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="idioms">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              Idioms
              <CountPill count={word.idioms.length} min={MIN_IDIOMS} />
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <SubList
              word={word}
              kind="idioms"
              addFn={addIdiom}
              updateFn={updateIdiom}
              deleteFn={deleteIdiom}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="examples">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              Examples (word level)
              <CountPill count={word.examples.length} />
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ExampleList word={word} parentType="word" parentId={word.id} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function CountPill({ count, min }: { count: number; min?: number }) {
  const ok = min === undefined || count >= min;
  return (
    <span
      className={
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold " +
        (ok
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300")
      }
    >
      {count}
      {min !== undefined && `/${min}`}
    </span>
  );
}

interface SubListProps {
  word: WordEntry;
  kind: "chunks" | "collocations" | "idioms";
  addFn: typeof addChunk;
  updateFn: typeof updateChunk;
  deleteFn: typeof deleteChunk;
}

function SubList({ word, kind, addFn, updateFn, deleteFn }: SubListProps) {
  const items = word[kind] as Array<{
    id: string;
    korean: string;
    english: string;
    ipa?: string;
    examples: ExampleSentence[];
  }>;
  const [adding, setAdding] = useState(false);
  const [nk, setNk] = useState("");
  const [ne, setNe] = useState("");
  const [nipa, setNipa] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ek, setEk] = useState("");
  const [ee, setEe] = useState("");
  const [eipa, setEipa] = useState("");

  const reset = () => {
    setNk(""); setNe(""); setNipa("");
  };
  const resetEdit = () => {
    setEditingId(null); setEk(""); setEe(""); setEipa("");
  };

  const handleAdd = async () => {
    if (!nk.trim() || !ne.trim()) {
      toast.error("Korean expression and English translation are required.");
      return;
    }
    try {
      await addFn(word.id, { korean: nk, english: ne, ipa: nipa });
      toast.success("Added.");
      reset();
      setAdding(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!ee.trim()) {
      toast.error("English translation is required.");
      return;
    }
    try {
      await updateFn(word.id, id, { korean: ek, english: ee, ipa: eipa });
      toast.success("Updated.");
      resetEdit();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this element and all its examples?")) return;
    try {
      await deleteFn(word.id, id);
      toast.success("Deleted.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && !adding && (
        <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
          No {kind} yet. Add at least{" "}
          {kind === "chunks"
            ? MIN_CHUNKS
            : kind === "collocations"
              ? MIN_COLLOCATIONS
              : MIN_IDIOMS}{" "}
          for a complete entry.
        </div>
      )}

      {items.map((it) => (
        <div key={it.id} className="rounded-md border bg-background p-2">
          {editingId === it.id ? (
            <div className="space-y-2">
              <Input
                value={ek}
                onChange={(e) => setEk(e.target.value)}
                placeholder="Korean"
                lang="ko"
              />
              <Input
                value={ee}
                onChange={(e) => setEe(e.target.value)}
                placeholder="English"
              />
              <div className="flex items-center gap-2">
                <Input
                  value={eipa}
                  onChange={(e) => setEipa(e.target.value)}
                  placeholder="IPA"
                  className="font-mono"
                />
                <IpaKeyboard
                  onInsert={(sym) => {
                    const el = document.activeElement as HTMLInputElement | null;
                    if (!el || !el.value) {
                      setEipa(eipa + sym);
                      return;
                    }
                    const pos = el.selectionStart ?? eipa.length;
                    const { value: next, pos: np } = insertIntoValue(eipa, sym, pos);
                    setEipa(next);
                    requestAnimationFrame(() => {
                      el.focus();
                      el.setSelectionRange(np, np);
                    });
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleUpdate(it.id)}>
                  <CheckIcon className="h-4 w-4" /> Save
                </Button>
                <Button size="sm" variant="ghost" onClick={resetEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium" lang="ko">
                      {it.korean}
                    </span>
                    <AudioButton text={it.korean} size="sm" />
                  </div>
                  <div className="text-sm text-muted-foreground">{it.english}</div>
                  {it.ipa && (
                    <div className="font-mono text-xs text-muted-foreground">
                      /{it.ipa}/
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditingId(it.id);
                      setEk(it.korean);
                      setEe(it.english);
                      setEipa(it.ipa ?? "");
                    }}
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-rose-500"
                    onClick={() => handleDelete(it.id)}
                  >
                    <Trash2Icon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <ExampleList
                word={word}
                parentType={kind === "chunks" ? "chunk" : kind === "collocations" ? "collocation" : "idiom"}
                parentId={it.id}
                compact
              />
            </div>
          )}
        </div>
      ))}

      {adding ? (
        <div className="space-y-2 rounded-md border border-dashed p-2">
          <Input
            value={nk}
            onChange={(e) => setNk(e.target.value)}
            placeholder="Korean expression"
            lang="ko"
          />
          <Input
            value={ne}
            onChange={(e) => setNe(e.target.value)}
            placeholder="English translation *"
          />
          <div className="flex items-center gap-2">
            <Input
              value={nipa}
              onChange={(e) => setNipa(e.target.value)}
              placeholder="IPA (optional)"
              className="font-mono"
            />
            <IpaKeyboard
              onInsert={(sym) => {
                const el = document.activeElement as HTMLInputElement | null;
                if (!el || !el.value) {
                  setNipa(nipa + sym);
                  return;
                }
                const pos = el.selectionStart ?? nipa.length;
                const { value: next, pos: np } = insertIntoValue(nipa, sym, pos);
                setNipa(next);
                requestAnimationFrame(() => {
                  el.focus();
                  el.setSelectionRange(np, np);
                });
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>
              <CheckIcon className="h-4 w-4" /> Add
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setAdding(false); reset(); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAdding(true)}
        >
          <PlusIcon className="h-4 w-4" /> Add {kind === "chunks" ? "chunk" : kind === "collocations" ? "collocation" : "idiom"}
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Example sentence list
// ---------------------------------------------------------------------------
function ExampleList({
  word,
  parentType,
  parentId,
  compact,
}: {
  word: WordEntry;
  parentType: "word" | "chunk" | "collocation" | "idiom";
  parentId: string;
  compact?: boolean;
}) {
  const allExamples: ExampleSentence[] =
    parentType === "word"
      ? word.examples
      : parentType === "chunk"
        ? word.chunks.find((c) => c.id === parentId)?.examples ?? []
        : parentType === "collocation"
          ? word.collocations.find((c) => c.id === parentId)?.examples ?? []
          : word.idioms.find((i) => i.id === parentId)?.examples ?? [];

  const [adding, setAdding] = useState(false);
  const [nk, setNk] = useState("");
  const [ne, setNe] = useState("");
  const [nipa, setNipa] = useState("");
  const [nnote, setNnote] = useState("");

  const handleAdd = async () => {
    if (!ne.trim()) {
      toast.error("English translation is required.");
      return;
    }
    try {
      await addExample(word.id, {
        korean: nk,
        english: ne,
        ipa: nipa,
        note: nnote,
        parentType,
        parentId,
      });
      toast.success("Example added.");
      setNk(""); setNe(""); setNipa(""); setNnote("");
      setAdding(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this example?")) return;
    try {
      await deleteExample(word.id, id);
      toast.success("Deleted.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className={compact ? "mt-2 space-y-1.5" : "space-y-2"}>
      {allExamples.length === 0 && !adding && (
        <div className="text-xs text-muted-foreground">No examples yet.</div>
      )}
      {allExamples.map((ex) => (
        <div key={ex.id} className="rounded border bg-background p-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm" lang="ko">{ex.korean}</span>
                <AudioButton text={ex.korean} size="sm" />
              </div>
              <div className="text-xs text-muted-foreground">{ex.english}</div>
              {ex.ipa && (
                <div className="font-mono text-[10px] text-muted-foreground">/{ex.ipa}/</div>
              )}
              {ex.note && (
                <div className="mt-1 text-[11px] italic text-muted-foreground">
                  {ex.note}
                </div>
              )}
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-rose-500"
              onClick={() => handleDelete(ex.id)}
            >
              <XIcon className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}

      {adding ? (
        <div className="space-y-2 rounded-md border border-dashed p-2">
          <Input
            value={nk}
            onChange={(e) => setNk(e.target.value)}
            placeholder="Korean sentence"
            lang="ko"
          />
          <Input
            value={ne}
            onChange={(e) => setNe(e.target.value)}
            placeholder="English translation *"
          />
          <div className="flex items-center gap-2">
            <Input
              value={nipa}
              onChange={(e) => setNipa(e.target.value)}
              placeholder="IPA (optional)"
              className="font-mono"
            />
            <IpaKeyboard
              onInsert={(sym) => setNipa(nipa + sym)}
            />
          </div>
          <Input
            value={nnote}
            onChange={(e) => setNnote(e.target.value)}
            placeholder="Personal note (optional)"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>
              <CheckIcon className="h-4 w-4" /> Add example
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="ghost" onClick={() => setAdding(true)}>
          <PlusIcon className="h-3.5 w-3.5" /> Add example
        </Button>
      )}
    </div>
  );
}

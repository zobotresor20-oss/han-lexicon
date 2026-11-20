// han-Lexicon — IPA on-screen keyboard.
// Inserts a chosen symbol at the current cursor position of an input/textarea.

"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { KeyboardIcon } from "lucide-react";

const IPA_SYMBOLS = [
  "ə", "ɪ", "ʊ", "æ", "ɑ", "ʌ", "ŋ", "θ", "ð", "ʃ",
  "ʒ", "tʃ", "dʒ", "ˈ", "ˌ", "ː", "ɚ", "ɝ", "ɹ", "ɾ",
  "ɡ", "ɕ", "ɯ", "ɭ", "ʨ", "ɸ", "β", "ɦ", "ɰ", "ɲ",
];

interface Props {
  targetId?: string;
  onInsert?: (symbol: string) => void;
  className?: string;
}

export function IpaKeyboard({ targetId, onInsert, className }: Props) {
  const [open, setOpen] = useState(false);

  const insert = useCallback(
    (symbol: string) => {
      if (onInsert) {
        onInsert(symbol);
        return;
      }
      if (!targetId) return;
      const el = document.getElementById(targetId) as
        | HTMLInputElement
        | HTMLTextAreaElement
        | null;
      if (!el) return;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const next = el.value.slice(0, start) + symbol + el.value.slice(end);
      el.value = next;
      const pos = start + symbol.length;
      el.setSelectionRange(pos, pos);
      el.focus();
      el.dispatchEvent(new Event("input", { bubbles: true }));
    },
    [onInsert, targetId]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={className}
          aria-label="IPA keyboard"
        >
          <KeyboardIcon className="h-4 w-4" />
          <span className="ml-1 hidden sm:inline">IPA</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[340px] p-3"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="mb-2 text-xs text-muted-foreground">
          Tap a symbol to insert it at the cursor position.
        </div>
        <div className="grid grid-cols-8 gap-1">
          {IPA_SYMBOLS.map((s) => (
            <button
              key={s}
              type="button"
              className="h-9 rounded-md border bg-background text-sm font-mono hover:bg-accent transition-colors"
              onClick={() => insert(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Pure helper to apply a symbol to a controlled value at a known position.
export function insertIntoValue(value: string, symbol: string, pos: number): {
  value: string;
  pos: number;
} {
  const next = value.slice(0, pos) + symbol + value.slice(pos);
  return { value: next, pos: pos + symbol.length };
}

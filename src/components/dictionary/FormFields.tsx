// han-Lexicon — Reusable text input with an IPA keyboard attached.
// Controlled component: value + onChange + optional ipa flag.

"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IpaKeyboard, insertIntoValue } from "@/components/common/IpaKeyboard";

interface FieldProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
}

interface TextFieldProps extends FieldProps {
  multiline?: boolean;
  rows?: number;
}

export function KoreanInput({
  value,
  onChange,
  placeholder,
  id,
  className,
  disabled,
}: FieldProps) {
  return (
    <Input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      lang="ko"
      className={className}
      disabled={disabled}
    />
  );
}

export function EnglishInput({
  value,
  onChange,
  placeholder,
  id,
  className,
  disabled,
}: FieldProps) {
  return (
    <Input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
    />
  );
}

// Field with optional IPA keyboard — used for the pronunciation field.
export function IpaInput({
  value,
  onChange,
  placeholder = "Pronunciation (IPA)",
  id,
  className,
  disabled,
}: FieldProps) {
  const ref = useRef<HTMLInputElement | null>(null);
  return (
    <div className="flex items-center gap-2">
      <Input
        ref={ref}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn("font-mono", className)}
        disabled={disabled}
      />
      <IpaKeyboard
        onInsert={(sym) => {
          const el = ref.current;
          if (!el) {
            onChange(value + sym);
            return;
          }
          const pos = el.selectionStart ?? value.length;
          const { value: next, pos: nextPos } = insertIntoValue(value, sym, pos);
          onChange(next);
          // Restore cursor on next tick
          requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(nextPos, nextPos);
          });
        }}
      />
    </div>
  );
}

function cn(...parts: (string | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function KoreanTextarea({
  value,
  onChange,
  placeholder,
  id,
  className,
  disabled,
  rows = 3,
}: TextFieldProps) {
  return (
    <Textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      lang="ko"
      className={className}
      disabled={disabled}
      rows={rows}
    />
  );
}

export function EnglishTextarea({
  value,
  onChange,
  placeholder,
  id,
  className,
  disabled,
  rows = 3,
}: TextFieldProps) {
  return (
    <Textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      rows={rows}
    />
  );
}

// han-Lexicon — Audio button that speaks Korean text via the Web Speech API.

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2Icon, Loader2Icon } from "lucide-react";
import { speakKorean, isSpeechSupported, hasKoreanVoice } from "@/lib/tts";
import { toast } from "sonner";

interface Props {
  text: string;
  rate?: number;
  preferNative?: boolean;
  size?: "sm" | "default" | "icon";
  className?: string;
  label?: string;
}

export function AudioButton({
  text,
  rate,
  preferNative = true,
  size = "icon",
  className,
  label,
}: Props) {
  const [speaking, setSpeaking] = useState(false);

  if (!isSpeechSupported()) {
    return (
      <Button
        type="button"
        variant="ghost"
        size={size}
        disabled
        className={className}
        aria-label="Audio not supported"
        title="Audio not supported in this browser"
      >
        <Volume2Icon className="h-4 w-4 opacity-40" />
        {label && <span className="ml-1 text-xs">{label}</span>}
      </Button>
    );
  }

  const onClick = async () => {
    if (speaking) return;
    if (!hasKoreanVoice()) {
      toast.error(
        "No Korean voice is available on this device. Install a Korean (ko-KR) TTS voice from your system settings."
      );
      return;
    }
    setSpeaking(true);
    try {
      await speakKorean(text, { rate, preferNative });
    } catch (e) {
      toast.error(`Could not play audio: ${(e as Error).message}`);
    } finally {
      setSpeaking(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      onClick={onClick}
      disabled={speaking}
      className={className}
      aria-label={`Listen to ${text}`}
    >
      {speaking ? (
        <Loader2Icon className="h-4 w-4 animate-spin text-emerald-500" />
      ) : (
        <Volume2Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      )}
      {label && <span className="ml-1 text-xs">{label}</span>}
    </Button>
  );
}

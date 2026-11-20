// han-Lexicon — Korean speech synthesis (Web Speech API).
// Client-only. Prefers a Korean (ko-KR) native voice when available.
// Never silently substitutes an English voice: callers must handle the
// "no Korean voice" case explicitly via hasKoreanVoice().

"use client";

import { useEffect, useState } from "react";

let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesReady = false;

function refreshVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  const v = window.speechSynthesis.getVoices();
  if (v.length > 0) {
    cachedVoices = v;
    voicesReady = true;
  }
  return cachedVoices;
}

// Initialize voice list as soon as the module loads on the client.
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    refreshVoices();
  };
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function getKoreanVoices(): SpeechSynthesisVoice[] {
  const all = refreshVoices();
  return all.filter((v) => v.lang === "ko-KR" || v.lang.startsWith("ko"));
}

export function hasKoreanVoice(): boolean {
  return getKoreanVoices().length > 0;
}

export function pickKoreanVoice(preferNative: boolean): SpeechSynthesisVoice | null {
  const voices = getKoreanVoices();
  if (voices.length === 0) return null;
  if (preferNative) {
    const native = voices.find((v) => /native|local/i.test(v.name) || v.localService);
    if (native) return native;
  }
  return voices[0];
}

// Speak a Korean utterance. Returns a promise resolving when finished.
export function speakKorean(
  text: string,
  opts: { rate?: number; preferNative?: boolean } = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isSpeechSupported()) {
      reject(new Error("Speech synthesis is not supported in this browser."));
      return;
    }
    try {
      // Cancel anything in-flight so rapid taps don't queue up.
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ko-KR";
      u.rate = opts.rate ?? 0.9;
      const voice = pickKoreanVoice(opts.preferNative ?? true);
      if (voice) u.voice = voice;
      u.onend = () => resolve();
      u.onerror = (ev) => reject(new Error(`Speech error: ${ev.error}`));
      window.speechSynthesis.speak(u);
    } catch (e) {
      reject(e as Error);
    }
  });
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}

// React hook that re-renders when voices become available
export function useKoreanVoicesReady(): boolean {
  const [ready, setReady] = useState<boolean>(() => voicesReady);
  useEffect(() => {
    if (!isSpeechSupported()) return;
    const handler = () => {
      refreshVoices();
      setReady(true);
    };
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    // Some browsers never fire voiceschanged; poll once after a tick.
    const t = setTimeout(() => {
      refreshVoices();
      if (cachedVoices.length > 0) setReady(true);
    }, 250);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
      clearTimeout(t);
    };
  }, []);
  return ready;
}

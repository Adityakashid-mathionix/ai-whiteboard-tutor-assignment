"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { PlaybackSpeed } from "@/types/lesson";

interface UseSpeechOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  speed?: PlaybackSpeed;
  isMuted?: boolean;
}

/**
 * Voice ranking, most natural first. Patterns are matched inside the language
 * the lesson is taught in, so a Hindi lesson never gets read by an English voice.
 */
/** Where a hand-picked voice is remembered between visits. */
const VOICE_STORAGE_KEY = "braynix_voice_name";

function readSavedVoiceName(): string | null {
  try {
    return localStorage.getItem(VOICE_STORAGE_KEY);
  } catch {
    return null;
  }
}

const PREMIUM_VOICE_PATTERNS: RegExp[] = [
  /Microsoft\s+(Aria|Jenny|Guy|Eric|Sara|Steffan|Swara|Madhur)/i,
  /Natural|Neural|Premium|Enhanced|Wavenet/i,
  /Samantha|Ava|Allison|Tom|Karen/i,
  /Google/i,
  /.*/,
];

function selectBestVoice(
  voices: SpeechSynthesisVoice[],
  speechLang: string
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  const prefix = speechLang.split("-")[0].toLowerCase();
  const exact = voices.filter((v) => v.lang.toLowerCase().replace("_", "-") === speechLang.toLowerCase());
  const sameLanguage = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
  const pools = [exact, sameLanguage, voices];

  for (const pool of pools) {
    if (pool.length === 0) continue;
    for (const pattern of PREMIUM_VOICE_PATTERNS) {
      const match = pool.find((v) => pattern.test(v.name));
      if (match) return match;
    }
  }

  return voices[0];
}

export function useSpeech({
  onStart,
  onEnd,
  onError,
  speed = 1,
  isMuted = false,
}: UseSpeechOptions = {}) {
  const [isSupported, setIsSupported] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  /** 0 → 1 through the current narration; drives the board's drawing reveal. */
  const [progress, setProgress] = useState(0);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  /** The narration currently being spoken, and how far into it we have got. */
  const currentTextRef = useRef("");
  const charIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const voicePinnedRef = useRef(false);

  const speechLang = "en-US";

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSupported(false);
      return;
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);

      setSelectedVoice((prev) => {
        // An explicit choice wins, including one saved from a previous visit.
        if (prev && voicePinnedRef.current && voices.includes(prev)) return prev;

        const savedName = readSavedVoiceName();
        if (savedName) {
          const saved = voices.find((v) => v.name === savedName);
          if (saved) {
            voicePinnedRef.current = true;
            return saved;
          }
        }

        return selectBestVoice(voices, speechLang);
      });
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearTimers();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setProgress(0);
  }, [clearTimers]);

  // Cancel any narration still queued when the studio unmounts.
  useEffect(() => stop, [stop]);

  const pickVoice = useCallback(
    (voice: SpeechSynthesisVoice | null) => {
      voicePinnedRef.current = Boolean(voice);
      setSelectedVoice(voice);

      try {
        if (voice) localStorage.setItem(VOICE_STORAGE_KEY, voice.name);
        else localStorage.removeItem(VOICE_STORAGE_KEY);
      } catch {
        // Storage blocked: the choice still holds for this session.
      }
    },
    []
  );

  /** Speaks a short sample so a voice can be judged before committing to it. */
  const previewVoice = useCallback(
    (voice: SpeechSynthesisVoice | null) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

      window.speechSynthesis.cancel();

      const sample = new SpeechSynthesisUtterance(
        "Right, let us look at how this actually works."
      );
      if (voice) sample.voice = voice;
      sample.lang = voice?.lang || speechLang;
      sample.rate = Math.max(0.6, Math.min(speed * 0.95, 2));
      sample.pitch = 1.03;

      window.speechSynthesis.speak(sample);
    },
    [speechLang, speed]
  );

  /** Simulated playback used when muted or when speech synthesis is absent. */
  const runSilentPlayback = useCallback(
    (text: string) => {
      const words = text.trim().split(/\s+/).length;
      const durationMs = Math.max(3000, (words / (2.4 * speed)) * 1000);
      const startedAt = Date.now();

      setIsSpeaking(true);
      setIsPaused(false);
      setProgress(0);
      onStart?.();

      tickRef.current = setInterval(() => {
        setProgress(Math.min(1, (Date.now() - startedAt) / durationMs));
      }, 120);

      timerRef.current = setTimeout(() => {
        clearTimers();
        setProgress(1);
        setIsSpeaking(false);
        onEnd?.();
      }, durationMs);
    },
    [clearTimers, onEnd, onStart, speed]
  );

  const speak = useCallback(
    (text: string, options: { fromCharIndex?: number } = {}) => {
      const offset = options.fromCharIndex ?? 0;
      stop();

      if (!text || text.trim().length === 0) {
        onEnd?.();
        return;
      }

      if (isMuted || !isSupported) {
        runSilentPlayback(text);
        return;
      }

      currentTextRef.current = text;
      charIndexRef.current = offset;

      const utterance = new SpeechSynthesisUtterance(text.slice(offset));
      utteranceRef.current = utterance;

      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.lang = selectedVoice?.lang || speechLang;

      // Slightly under the nominal rate reads as calmer and more teacher-like.
      utterance.rate = Math.max(0.6, Math.min(speed * 0.95, 2));
      utterance.pitch = 1.03;
      utterance.volume = 1;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setProgress(text.length ? offset / text.length : 0);
        onStart?.();
      };

      // Word boundaries give the board something real to sync its drawing to.
      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        if (!text.length) return;
        charIndexRef.current = offset + event.charIndex;
        setProgress(Math.min(1, charIndexRef.current / text.length));
      };

      utterance.onend = () => {
        setProgress(1);
        setIsSpeaking(false);
        setIsPaused(false);
        onEnd?.();
      };

      utterance.onpause = () => setIsPaused(true);
      utterance.onresume = () => setIsPaused(false);

      utterance.onerror = (event) => {
        // "interrupted" / "canceled" are expected when seeking or stopping.
        if (event.error !== "interrupted" && event.error !== "canceled") {
          console.error("SpeechSynthesis error:", event.error);
          onError?.(event.error);
          // Keep the lesson moving rather than stalling on a dead utterance.
          onEnd?.();
        }
        setIsSpeaking(false);
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [isMuted, isSupported, onEnd, onError, onStart, runSilentPlayback, selectedVoice, speechLang, speed, stop]
  );

  const pause = useCallback(() => {
    if (isMuted || !isSupported) {
      clearTimers();
      setIsPaused(true);
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [clearTimers, isMuted, isSupported]);

  const resume = useCallback(
    (currentText?: string) => {
      if ((isMuted || !isSupported) && currentText) {
        runSilentPlayback(currentText);
        return;
      }

      if (window.speechSynthesis.paused && window.speechSynthesis.speaking) {
        window.speechSynthesis.resume();
        setIsPaused(false);
        return;
      }

      // Chrome on Windows frequently drops a paused utterance instead of
      // holding it. Restart from the last word boundary we heard, so resuming
      // continues where the tutor stopped rather than from the top.
      const text = currentText || currentTextRef.current;
      if (!text) return;

      const offset = Math.min(charIndexRef.current, Math.max(0, text.length - 1));
      const resumeAt = text.lastIndexOf(" ", offset) + 1;
      speak(text, { fromCharIndex: resumeAt > 0 ? resumeAt : 0 });
    },
    [isMuted, isSupported, runSilentPlayback, speak]
  );

  return {
    isSupported,
    isSpeaking,
    isPaused,
    progress,
    availableVoices,
    selectedVoice,
    setSelectedVoice: pickVoice,
    previewVoice,
    speak,
    pause,
    resume,
    stop,
  };
}

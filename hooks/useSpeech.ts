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
 * Premium voice ranking — tries to find the most natural, warm, human-sounding
 * voice available on the user's device. Prioritises Microsoft Edge neural voices,
 * then macOS premium voices, then Google voices, then any English voice.
 */
const PREMIUM_VOICE_PATTERNS: { name: RegExp; lang: RegExp }[] = [
  // Microsoft Edge neural TTS voices — extremely natural
  { name: /Microsoft\s+(Aria|Jenny|Guy|Eric|Sara|Steffan)/i, lang: /^en/i },
  // Microsoft Online (Natural) voices
  { name: /Natural/i, lang: /^en/i },
  // macOS high-quality voices
  { name: /Samantha|Ava|Allison|Tom|Karen/i, lang: /^en/i },
  // Google TTS voices
  { name: /Google\s+UK\s+English\s+(Female|Male)/i, lang: /^en/i },
  { name: /Google\s+US\s+English/i, lang: /^en/i },
  // Any voice with "Neural" or "Premium" or "Enhanced" in its name
  { name: /Neural|Premium|Enhanced|Wavenet/i, lang: /^en/i },
  // Any English voice as final fallback
  { name: /.*/i, lang: /^en/i },
];

function selectBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  for (const pattern of PREMIUM_VOICE_PATTERNS) {
    const match = voices.find(
      (v) => pattern.name.test(v.name) && pattern.lang.test(v.lang)
    );
    if (match) return match;
  }

  // Absolute fallback: first voice
  return voices[0];
}

export function useSpeech({
  onStart,
  onEnd,
  onError,
  speed = 1,
  isMuted = false,
}: UseSpeechOptions = {}) {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const muteTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and load voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSupported(false);
      return;
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);

      // Only auto-select if the user hasn't manually chosen
      setSelectedVoice((prev) => {
        if (prev && voices.includes(prev)) return prev;
        return selectBestVoice(voices);
      });
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (muteTimerRef.current) {
        clearTimeout(muteTimerRef.current);
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (muteTimerRef.current) {
      clearTimeout(muteTimerRef.current);
      muteTimerRef.current = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      stop();

      if (!text || text.trim().length === 0) {
        onEnd?.();
        return;
      }

      // If muted or Web Speech is not supported, simulate segment duration smoothly
      if (isMuted || !isSupported) {
        setIsSpeaking(true);
        setIsPaused(false);
        onStart?.();

        const wordCount = text.trim().split(/\s+/).length;
        const durationMs = Math.max(3000, (wordCount / (2.2 * speed)) * 1000);

        muteTimerRef.current = setTimeout(() => {
          setIsSpeaking(false);
          onEnd?.();
        }, durationMs);

        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // --- Voice Tuning for warm, teacher-like delivery ---
      utterance.rate = Math.max(0.7, Math.min(speed * 0.92, 1.8));  // slightly slower = calmer
      utterance.pitch = 1.05;   // slightly warm, not robotic
      utterance.volume = 0.95;  // not blasting

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        onStart?.();
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        onEnd?.();
      };

      utterance.onpause = () => {
        setIsPaused(true);
      };

      utterance.onresume = () => {
        setIsPaused(false);
      };

      utterance.onerror = (event) => {
        // 'interrupted' or 'canceled' are standard when user skips or stops
        if (event.error !== "interrupted" && event.error !== "canceled") {
          console.error("SpeechSynthesis error:", event.error);
          onError?.(event.error);
        }
        setIsSpeaking(false);
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [isMuted, isSupported, onEnd, onError, onStart, selectedVoice, speed, stop]
  );

  const pause = useCallback(() => {
    if (isMuted && muteTimerRef.current) {
      clearTimeout(muteTimerRef.current);
      muteTimerRef.current = null;
      setIsPaused(true);
      return;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    }
  }, [isMuted]);

  const resume = useCallback(
    (currentText?: string) => {
      if (isMuted && currentText) {
        speak(currentText);
        return;
      }

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          setIsPaused(false);
        } else if (currentText && !window.speechSynthesis.speaking) {
          speak(currentText);
        }
      }
    },
    [isMuted, speak]
  );

  return {
    isSupported,
    isSpeaking,
    isPaused,
    availableVoices,
    selectedVoice,
    setSelectedVoice,
    speak,
    pause,
    resume,
    stop,
  };
}

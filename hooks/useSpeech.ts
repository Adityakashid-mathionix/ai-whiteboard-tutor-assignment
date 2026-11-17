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

      // Prefer a natural, expressive English voice
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Natural") ||
            v.name.includes("Neural") ||
            v.name.includes("Google") ||
            v.name.includes("Samantha") ||
            v.name.includes("Daniel") ||
            v.name.includes("Jenny"))
      ) || voices.find((v) => v.lang.startsWith("en")) || voices[0] || null;

      setSelectedVoice(preferred);
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

        // Calculate simulated duration based on reading speed (~130 words per min adjusted for speed)
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

      utterance.rate = speed;
      utterance.pitch = 1.0;

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
      // In muted mode, just pause the timer
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
        // Resume simulation
        speak(currentText);
        return;
      }

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          setIsPaused(false);
        } else if (currentText && !window.speechSynthesis.speaking) {
          // Fallback if browser dropped paused utterance
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

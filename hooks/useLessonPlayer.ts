"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Lesson, PlaybackSpeed, PlaybackStatus } from "@/types/lesson";
import { useSpeech } from "./useSpeech";
import { useWhiteboard } from "./useWhiteboard";

interface UseLessonPlayerProps {
  lesson: Lesson | null;
  onLessonComplete?: () => void;
}

export function useLessonPlayer({ lesson, onLessonComplete }: UseLessonPlayerProps) {
  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const whiteboard = useWhiteboard();

  const indexRef = useRef(0);
  indexRef.current = currentSegmentIndex;
  const statusRef = useRef<PlaybackStatus>("idle");
  statusRef.current = status;

  // Stable identity: recreating this each render would reset every callback.
  const allSegmentActions = useMemo(
    () => (lesson ? lesson.segments.map((s) => s.visualActions) : []),
    [lesson]
  );

  const handleNarrationEnd = useCallback(() => {
    if (!lesson || statusRef.current !== "playing") return;

    const nextIndex = indexRef.current + 1;
    if (nextIndex < lesson.segments.length) {
      setCurrentSegmentIndex(nextIndex);
    } else {
      setStatus("completed");
      onLessonComplete?.();
    }
  }, [lesson, onLessonComplete]);

  const handleNarrationError = useCallback((err: string) => {
    console.warn("Narration error handled:", err);
    setErrorMessage(
      "Your browser's voice engine hiccuped. The lesson keeps going — use mute if it repeats."
    );
  }, []);

  const speech = useSpeech({
    speed,
    isMuted,
    languageCode: lesson?.language || "en",
    onEnd: handleNarrationEnd,
    onError: handleNarrationError,
  });

  const play = useCallback(() => {
    if (!lesson || lesson.segments.length === 0) return;

    const targetIndex = status === "completed" ? 0 : currentSegmentIndex;
    setStatus("playing");

    if (targetIndex === currentSegmentIndex) {
      // The index effect will not fire, so start this segment directly.
      whiteboard.setCumulativeState(allSegmentActions, targetIndex);
      speech.speak(lesson.segments[targetIndex].narration);
    } else {
      setCurrentSegmentIndex(targetIndex);
    }
  }, [allSegmentActions, currentSegmentIndex, lesson, speech, status, whiteboard]);

  const pause = useCallback(() => {
    speech.pause();
    setStatus("paused");
  }, [speech]);

  const resume = useCallback(() => {
    if (!lesson) return;
    setStatus("playing");
    speech.resume(lesson.segments[currentSegmentIndex]?.narration);
  }, [currentSegmentIndex, lesson, speech]);

  const seekToSegment = useCallback(
    (targetIndex: number) => {
      if (!lesson || targetIndex < 0 || targetIndex >= lesson.segments.length) return;

      speech.stop();
      whiteboard.setCumulativeState(allSegmentActions, targetIndex);

      if (targetIndex === currentSegmentIndex && status === "playing") {
        speech.speak(lesson.segments[targetIndex].narration);
        return;
      }

      setCurrentSegmentIndex(targetIndex);
      if (status !== "playing") setStatus("paused");
    },
    [allSegmentActions, currentSegmentIndex, lesson, speech, status, whiteboard]
  );

  const restart = useCallback(() => {
    speech.stop();
    if (!lesson || lesson.segments.length === 0) return;

    setStatus("playing");
    if (currentSegmentIndex === 0) {
      whiteboard.setCumulativeState(allSegmentActions, 0);
      speech.speak(lesson.segments[0].narration);
    } else {
      setCurrentSegmentIndex(0);
    }
  }, [allSegmentActions, currentSegmentIndex, lesson, speech, whiteboard]);

  // Speak whichever segment becomes current while playing.
  useEffect(() => {
    if (status !== "playing" || !lesson?.segments[currentSegmentIndex]) return;

    whiteboard.setCumulativeState(allSegmentActions, currentSegmentIndex);
    speech.speak(lesson.segments[currentSegmentIndex].narration);
    // Re-running on speech/whiteboard identity would restart narration constantly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSegmentIndex, status === "playing"]);

  // Rate only applies to a new utterance, so re-speak the current line on change.
  const didMountSpeed = useRef(false);
  useEffect(() => {
    if (!didMountSpeed.current) {
      didMountSpeed.current = true;
      return;
    }
    if (statusRef.current !== "playing" || !lesson?.segments[indexRef.current]) return;
    speech.speak(lesson.segments[indexRef.current].narration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, isMuted]);

  // Reset cleanly whenever a different lesson is loaded.
  useEffect(() => {
    if (!lesson) return;

    speech.stop();
    whiteboard.clearBoard();
    setCurrentSegmentIndex(0);
    setStatus("idle");
    setErrorMessage(null);

    if (lesson.segments[0]) {
      whiteboard.setCumulativeState(
        lesson.segments.map((s) => s.visualActions),
        0
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  return {
    status,
    currentSegmentIndex,
    currentSegment: lesson?.segments[currentSegmentIndex] || null,
    totalSegments: lesson?.segments.length || 0,
    speed,
    setSpeed,
    isMuted,
    setIsMuted,
    errorMessage,
    setErrorMessage,
    whiteboard,
    speech,
    play,
    pause,
    resume,
    seekToSegment,
    restart,
  };
}

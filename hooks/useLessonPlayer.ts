"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Lesson, PlaybackSpeed, PlaybackStatus } from "@/types/lesson";
import { useSpeech } from "./useSpeech";
import { useWhiteboard } from "./useWhiteboard";

interface UseLessonPlayerProps {
  lesson: Lesson | null;
  onLessonComplete?: () => void;
}

export function useLessonPlayer({ lesson, onLessonComplete }: UseLessonPlayerProps) {
  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const whiteboard = useWhiteboard();
  const currentSegmentIndexRef = useRef<number>(0);
  currentSegmentIndexRef.current = currentSegmentIndex;

  const statusRef = useRef<PlaybackStatus>("idle");
  statusRef.current = status;

  // Handle when a segment's narration finishes
  const handleNarrationEnd = useCallback(() => {
    if (!lesson) return;

    if (statusRef.current !== "playing") {
      return;
    }

    const nextIndex = currentSegmentIndexRef.current + 1;
    if (nextIndex < lesson.segments.length) {
      // Advance to next segment
      setCurrentSegmentIndex(nextIndex);
    } else {
      // Completed entire lesson
      setStatus("completed");
      onLessonComplete?.();
    }
  }, [lesson, onLessonComplete]);

  const handleNarrationError = useCallback((err: string) => {
    console.warn("Narration error handled:", err);
    // Don't crash playback; automatically advance or report
  }, []);

  const speech = useSpeech({
    speed,
    isMuted,
    onEnd: handleNarrationEnd,
    onError: handleNarrationError,
  });

  // Extract all segment visual actions matrix
  const allSegmentActions = lesson ? lesson.segments.map((s) => s.visualActions) : [];

  // Play a specific segment by index
  const playSegment = useCallback(
    (index: number) => {
      if (!lesson || !lesson.segments[index]) return;

      const segment = lesson.segments[index];
      setCurrentSegmentIndex(index);

      // Render cumulative visual actions up to this segment
      whiteboard.setCumulativeState(allSegmentActions, index);

      // Start narration
      speech.speak(segment.narration);
    },
    [allSegmentActions, lesson, speech, whiteboard]
  );

  // Play from current segment or beginning
  const play = useCallback(() => {
    if (!lesson || lesson.segments.length === 0) return;

    setStatus("playing");
    const targetIndex = status === "completed" ? 0 : currentSegmentIndex;
    playSegment(targetIndex);
  }, [currentSegmentIndex, lesson, playSegment, status]);

  // Pause playback
  const pause = useCallback(() => {
    speech.pause();
    setStatus("paused");
  }, [speech]);

  // Resume playback
  const resume = useCallback(() => {
    if (!lesson) return;
    setStatus("playing");
    const currentSegment = lesson.segments[currentSegmentIndex];
    speech.resume(currentSegment?.narration);
  }, [currentSegmentIndex, lesson, speech]);

  // Seek to specific segment
  const seekToSegment = useCallback(
    (targetIndex: number) => {
      if (!lesson || targetIndex < 0 || targetIndex >= lesson.segments.length) return;

      speech.stop();
      setCurrentSegmentIndex(targetIndex);
      whiteboard.setCumulativeState(allSegmentActions, targetIndex);

      if (status === "playing") {
        const targetSegment = lesson.segments[targetIndex];
        speech.speak(targetSegment.narration);
      } else {
        setStatus("paused");
      }
    },
    [allSegmentActions, lesson, speech, status, whiteboard]
  );

  // Restart lesson from segment 0
  const restart = useCallback(() => {
    speech.stop();
    whiteboard.clearBoard();
    setCurrentSegmentIndex(0);
    setStatus("playing");

    if (lesson && lesson.segments.length > 0) {
      setTimeout(() => {
        playSegment(0);
      }, 50);
    }
  }, [lesson, playSegment, speech, whiteboard]);

  // When segment changes while playing, trigger playback
  useEffect(() => {
    if (status === "playing" && lesson && lesson.segments[currentSegmentIndex]) {
      const segment = lesson.segments[currentSegmentIndex];
      whiteboard.setCumulativeState(allSegmentActions, currentSegmentIndex);
      speech.speak(segment.narration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSegmentIndex]);

  // When a new lesson is loaded, initialize cleanly
  useEffect(() => {
    if (lesson) {
      speech.stop();
      whiteboard.clearBoard();
      setCurrentSegmentIndex(0);
      setStatus("idle");
      setErrorMessage(null);
      // Pre-render segment 0 actions immediately so whiteboard is not blank
      if (lesson.segments[0]) {
        whiteboard.setCumulativeState(
          lesson.segments.map((s) => s.visualActions),
          0
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speech.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

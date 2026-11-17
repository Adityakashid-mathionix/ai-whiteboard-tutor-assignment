"use client";

import React from "react";
import { PlaybackSpeed, PlaybackStatus, LessonSegment } from "@/types/lesson";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";

interface PlaybackControlsProps {
  status: PlaybackStatus;
  currentSegmentIndex: number;
  totalSegments: number;
  segments: LessonSegment[];
  speed: PlaybackSpeed;
  isMuted: boolean;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onSeek: (index: number) => void;
  onSetSpeed: (speed: PlaybackSpeed) => void;
  onToggleMute: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  status,
  currentSegmentIndex,
  totalSegments,
  segments,
  speed,
  isMuted,
  onPlay,
  onPause,
  onResume,
  onRestart,
  onSeek,
  onSetSpeed,
  onToggleMute,
}) => {
  const speeds: PlaybackSpeed[] = [0.75, 1, 1.25, 1.5];

  const handleMainAction = () => {
    if (status === "playing") {
      onPause();
    } else if (status === "paused") {
      onResume();
    } else {
      onPlay();
    }
  };

  const handlePrev = () => {
    if (currentSegmentIndex > 0) {
      onSeek(currentSegmentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentSegmentIndex < totalSegments - 1) {
      onSeek(currentSegmentIndex + 1);
    }
  };

  return (
    <div className="flex flex-col w-full bg-paper rounded-2xl border border-border p-4 shadow-[0_8px_30px_rgba(0,0,0,0.05)] space-y-3">
      {/* Top Scrubber / Segment Pills Timeline */}
      <div className="w-full">
        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mb-2 px-1">
          <span className="font-mono text-foreground/80 font-semibold">
            Chapter {totalSegments > 0 ? currentSegmentIndex + 1 : 0} of {totalSegments}
          </span>
          <span className="truncate max-w-[280px] text-electric font-semibold font-serif italic text-sm">
            {segments[currentSegmentIndex]?.heading || ""}
          </span>
        </div>

        {/* Clickable Multi-Segment Progress Track */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 w-full">
          {segments.map((seg, idx) => {
            const isActive = idx === currentSegmentIndex;
            const isCompleted = idx < currentSegmentIndex;

            return (
              <button
                key={seg.id || idx}
                onClick={() => onSeek(idx)}
                title={`Seek to: ${seg.heading}`}
                className="group flex flex-col space-y-1 text-left active:scale-95 transition-transform"
              >
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? "bg-electric shadow-[0_0_8px_rgba(22,119,255,0.6)]"
                      : isCompleted
                      ? "bg-emerald-500"
                      : "bg-muted group-hover:bg-neutral-200"
                  }`}
                />
                <span
                  className={`text-[9px] font-mono truncate hidden sm:block ${
                    isActive ? "text-electric font-bold" : "text-muted-foreground group-hover:text-muted-foreground"
                  }`}
                >
                  {idx + 1}. {seg.heading}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Transport Controls */}
      <div className="flex items-center justify-between pt-1">
        {/* Left: Restart & Prev */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={onRestart}
            title="Restart Masterclass"
            className="p-2 rounded-xl bg-muted hover:bg-muted border border-border text-foreground/80 hover:text-foreground transition-all duration-200 active:scale-95 shadow-paper"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handlePrev}
            disabled={currentSegmentIndex <= 0}
            title="Previous Chapter (←)"
            className="p-2 rounded-xl bg-muted hover:bg-muted border border-border text-foreground/80 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 active:scale-95 shadow-paper"
          >
            <SkipBack className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Big Play / Pause Button */}
        <button
          onClick={handleMainAction}
          className="flex items-center space-x-2 px-6 py-2.5 rounded-full bg-electric hover:bg-electric-hover text-white font-mono text-xs font-semibold shadow-md shadow-electric/25 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          {status === "playing" ? (
            <>
              <Pause className="w-4 h-4" fill="currentColor" />
              <span>PAUSE</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" fill="currentColor" />
              <span>{status === "paused" ? "RESUME" : "PLAY MASTERCLASS"}</span>
            </>
          )}
        </button>

        {/* Right: Next, Speed & Audio Mute */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleNext}
            disabled={currentSegmentIndex >= totalSegments - 1}
            title="Next Chapter (→)"
            className="p-2 rounded-xl bg-muted hover:bg-muted border border-border text-foreground/80 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 active:scale-95 shadow-paper"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="hidden sm:flex items-center bg-muted rounded-xl border border-border p-0.5">
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => onSetSpeed(s)}
                className={`px-2 py-1 text-[10px] font-mono rounded-lg transition-all duration-150 ${
                  speed === s
                    ? "bg-paper text-electric font-bold shadow-paper scale-105"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Audio Mute Toggle */}
          <button
            onClick={onToggleMute}
            title={isMuted ? "Unmute Narration (M)" : "Mute Narration (M)"}
            className={`p-2 rounded-xl border transition-all duration-200 active:scale-95 shadow-paper ${
              isMuted
                ? "bg-rose-50 border-rose-200 text-rose-600"
                : "bg-muted hover:bg-muted border-border text-foreground/80 hover:text-foreground"
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

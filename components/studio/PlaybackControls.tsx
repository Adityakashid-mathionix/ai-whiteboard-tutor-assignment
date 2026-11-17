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
    <div className="flex flex-col w-full bg-[#10121a] rounded-2xl border border-[#222533] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.6)] space-y-3">
      {/* Top Scrubber / Segment Pills Timeline */}
      <div className="w-full">
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-2 px-1">
          <span className="font-sans font-bold text-neutral-200">
            Chapter {totalSegments > 0 ? currentSegmentIndex + 1 : 0} of {totalSegments}
          </span>
          <span className="truncate max-w-[280px] text-[#00d2ff] font-semibold">
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
                className={`group relative h-2.5 rounded-full transition-all duration-300 overflow-hidden ${
                  isActive
                    ? "bg-[#0066ff] ring-2 ring-[#0066ff]/50 shadow-[0_0_12px_rgba(0,102,255,0.7)]"
                    : isCompleted
                    ? "bg-[#00b875] hover:bg-[#00d084]"
                    : "bg-[#222533] hover:bg-[#2e3245]"
                }`}
                title={`Jump to Chapter ${idx + 1}: ${seg.heading}`}
              >
                {isActive && status === "playing" && (
                  <span className="absolute inset-0 bg-white/40 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Transport Controls Deck */}
      <div className="flex items-center justify-between pt-1">
        {/* Left: Navigation Actions */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={onRestart}
            title="Restart Lesson from Beginning"
            className="p-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-[#1a1d2c] transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrev}
            disabled={currentSegmentIndex <= 0}
            title="Previous Chapter (←)"
            className="p-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-[#1a1d2c] disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentSegmentIndex >= totalSegments - 1}
            title="Next Chapter (→)"
            className="p-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-[#1a1d2c] disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Tactile Ergonomic Play/Pause Button */}
        <button
          onClick={handleMainAction}
          className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#0066ff] hover:bg-[#0052cc] text-white font-bold shadow-[0_0_25px_rgba(0,102,255,0.5)] transition-all duration-200 active:scale-95"
          title={status === "playing" ? "Pause Lesson (Space)" : "Play Lesson (Space)"}
        >
          {status === "playing" ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Right: Multiplier Speeds & Volume Mute */}
        <div className="flex items-center space-x-2">
          {/* Speed Selector */}
          <div className="hidden sm:flex items-center bg-[#141722] p-1 rounded-xl border border-[#222533]">
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => onSetSpeed(s)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
                  speed === s
                    ? "bg-[#0066ff] text-white font-bold shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Mute Audio Button */}
          <button
            onClick={onToggleMute}
            title={isMuted ? "Unmute Voice Narration (M)" : "Mute Voice Narration (M)"}
            className={`p-2.5 rounded-xl transition-all ${
              isMuted
                ? "bg-[#2b0d14] text-[#ff3355] border border-[#521926] shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-[#1a1d2c]"
            }`}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

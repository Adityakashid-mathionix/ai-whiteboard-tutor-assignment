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
    <div className="flex flex-col w-full bg-[#0a0e17] rounded-2xl border border-slate-800/80 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl space-y-3">
      {/* Top Scrubber / Segment Pills Timeline */}
      <div className="w-full">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2 px-1">
          <span className="font-sans font-semibold text-slate-200">
            Chapter {totalSegments > 0 ? currentSegmentIndex + 1 : 0} of {totalSegments}
          </span>
          <span className="truncate max-w-[280px] text-sky-400 font-medium">
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
                    ? "bg-sky-500 ring-2 ring-sky-400/50 shadow-[0_0_12px_rgba(56,189,248,0.6)]"
                    : isCompleted
                    ? "bg-emerald-500/80 hover:bg-emerald-400"
                    : "bg-slate-800 hover:bg-slate-700"
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
        {/* Left: Quick Actions & Navigation */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={onRestart}
            title="Restart Lesson from Beginning"
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrev}
            disabled={currentSegmentIndex <= 0}
            title="Previous Chapter"
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentSegmentIndex >= totalSegments - 1}
            title="Next Chapter"
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Tactile Ergonomic Play/Pause Button */}
        <button
          onClick={handleMainAction}
          className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-bold shadow-[0_0_25px_rgba(56,189,248,0.35)] transition-all duration-200 active:scale-95"
          title={status === "playing" ? "Pause Lesson" : "Play Lesson"}
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
          <div className="hidden sm:flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 shadow-inner">
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => onSetSpeed(s)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
                  speed === s
                    ? "bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Mute Audio Button */}
          <button
            onClick={onToggleMute}
            title={isMuted ? "Unmute Voice Narration" : "Mute Voice Narration"}
            className={`p-2.5 rounded-xl transition-all ${
              isMuted
                ? "bg-rose-950/50 text-rose-400 border border-rose-800/50 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/80"
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

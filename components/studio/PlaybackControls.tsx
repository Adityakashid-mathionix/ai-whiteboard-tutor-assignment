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
    <div className="flex flex-col w-full bg-[#121620] rounded-2xl border border-[#282d3b] p-4 shadow-2xl space-y-3">
      {/* Top Scrubber / Segment Pills Timeline */}
      <div className="w-full">
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-2 px-1">
          <span className="font-mono text-neutral-300">
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
                className="group flex flex-col space-y-1 text-left"
              >
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? "bg-electric shadow-[0_0_10px_rgba(22,119,255,0.7)]"
                      : isCompleted
                      ? "bg-emerald-500/80"
                      : "bg-[#222530] group-hover:bg-[#282d3b]"
                  }`}
                />
                <span
                  className={`text-[9px] font-mono truncate hidden sm:block ${
                    isActive ? "text-electric font-bold" : "text-neutral-500"
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
            className="p-2 rounded-xl bg-[#141720] hover:bg-[#181c28] border border-[#282d3b] text-neutral-300 hover:text-white transition-all active:scale-95 shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handlePrev}
            disabled={currentSegmentIndex <= 0}
            title="Previous Chapter (←)"
            className="p-2 rounded-xl bg-[#141720] hover:bg-[#181c28] border border-[#282d3b] text-neutral-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 shadow-sm"
          >
            <SkipBack className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Big Play / Pause Button */}
        <button
          onClick={handleMainAction}
          className="flex items-center space-x-2 px-6 py-2.5 rounded-full bg-electric hover:bg-[#0a4fbf] text-white font-mono text-xs font-semibold shadow-electric hover:scale-105 active:scale-95 transition-all"
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
            className="p-2 rounded-xl bg-[#141720] hover:bg-[#181c28] border border-[#282d3b] text-neutral-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 shadow-sm"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="hidden sm:flex items-center bg-[#141720] rounded-xl border border-[#282d3b] p-0.5">
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => onSetSpeed(s)}
                className={`px-2 py-1 text-[10px] font-mono rounded-lg transition-all ${
                  speed === s
                    ? "bg-electric text-white font-bold shadow-xs"
                    : "text-neutral-400 hover:text-white"
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
            className={`p-2 rounded-xl border transition-all active:scale-95 shadow-sm ${
              isMuted
                ? "bg-rose-500/10 border-rose-500/40 text-rose-400"
                : "bg-[#141720] hover:bg-[#181c28] border-[#282d3b] text-neutral-300 hover:text-white"
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

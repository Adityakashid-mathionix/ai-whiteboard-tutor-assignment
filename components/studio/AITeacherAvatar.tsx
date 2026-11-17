"use client";

import React, { useState } from "react";
import { Sparkles, Volume2, Radio, CheckCircle2, Mic } from "lucide-react";
import { PlaybackStatus } from "@/types/lesson";

interface AITeacherAvatarProps {
  status: PlaybackStatus;
  currentSegmentHeading?: string;
  narration?: string;
  teacherName?: string;
  isFloating?: boolean;
}

export const AITeacherAvatar: React.FC<AITeacherAvatarProps> = ({
  status,
  currentSegmentHeading,
  narration,
  teacherName = "Dr. Maya Chen",
  isFloating = false,
}) => {
  const isSpeaking = status === "playing";
  const [isMinimized, setIsMinimized] = useState(false);

  if (isFloating && isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="flex items-center space-x-2.5 px-3.5 py-2 rounded-full bg-white/95 border border-[#e4dfd3] shadow-lg text-xs font-medium text-[#121316] hover:border-[#1677ff] transition-all backdrop-blur-xl"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-[#1677ff] animate-pulse" />
        <span className="font-mono text-[11px] font-semibold">Tutor AI (Expand)</span>
      </button>
    );
  }

  return (
    <div
      className={`relative flex flex-col rounded-2xl border transition-all duration-300 ${
        isFloating
          ? "bg-white/95 backdrop-blur-2xl border-[#e4dfd3] shadow-[0_20px_50px_rgba(0,0,0,0.08)] p-3.5 max-w-sm"
          : "bg-white border-[#e6e2d8] shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-4"
      }`}
    >
      {/* Top Identity Row */}
      <div className="flex items-center justify-between pb-3 border-b border-[#f0ede6] mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="relative flex items-center justify-center">
            <span
              className={`block w-2.5 h-2.5 rounded-full ${
                isSpeaking
                  ? "bg-[#1677ff] shadow-[0_0_10px_rgba(22,119,255,0.8)]"
                  : status === "paused"
                  ? "bg-amber-500"
                  : "bg-neutral-400"
              }`}
            />
            {isSpeaking && (
              <span className="absolute -inset-1 rounded-full bg-[#1677ff]/40 animate-ping" />
            )}
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <h4 className="text-xs font-semibold text-[#121316] tracking-tight font-sans">
                {teacherName}
              </h4>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#1677ff]/10 text-[#1677ff] border border-[#1677ff]/20">
                AI FELLOW
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 font-medium">
              {isSpeaking
                ? "Live Synchronized Lecture"
                : status === "paused"
                ? "Narration Paused"
                : "Ready to Teach"}
            </p>
          </div>
        </div>

        {isFloating && (
          <button
            onClick={() => setIsMinimized(true)}
            className="text-neutral-400 hover:text-neutral-700 text-xs px-2 py-0.5 rounded-md hover:bg-neutral-100 transition-colors"
            title="Minimize"
          >
            ✕
          </button>
        )}
      </div>

      {/* Main Visualizer & Live Transcript */}
      <div className="flex items-start space-x-3.5">
        {/* Apple/Hume Style Ethereal Voice Harmonic Orb */}
        <div className="relative flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0f2b5c] via-[#1677ff] to-[#00d2ff] p-0.5 flex items-center justify-center overflow-hidden shadow-sm group">
          {/* Internal undulating glow layers */}
          <div
            className={`absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#1677ff] via-[#4338ca] to-[#06b6d4] opacity-90 transition-transform duration-700 ${
              isSpeaking ? "animate-pulse scale-105" : "scale-100"
            }`}
          />
          {/* Ambient harmonic rings */}
          <div
            className={`absolute inset-1 rounded-xl border border-white/30 ${
              isSpeaking ? "animate-spin [animation-duration:8s]" : ""
            }`}
          />

          {/* Central Acoustic Icon */}
          <div className="relative z-10 flex items-center justify-center text-white">
            {isSpeaking ? (
              <Radio className="w-5 h-5 animate-pulse text-white drop-shadow-md" />
            ) : (
              <Volume2 className="w-5 h-5 text-white/90" />
            )}
          </div>
        </div>

        {/* Dynamic Spoken Dialogue Stream */}
        <div className="flex-1 min-w-0">
          <div className="p-2.5 rounded-xl bg-[#faf8f5] border border-[#e8e4db] text-xs text-neutral-800 leading-relaxed font-sans shadow-2xs">
            {isSpeaking ? (
              <div>
                <span className="font-mono text-[9px] font-bold text-[#1677ff] uppercase tracking-wider block mb-0.5">
                  Spoken Script:
                </span>
                <p className="line-clamp-3 text-[#121316] font-serif italic text-[11px] leading-snug">
                  “{narration || "Follow the whiteboard diagrams as we explore this core concept."}”
                </p>
              </div>
            ) : status === "paused" ? (
              <p className="text-neutral-600 text-[11px]">
                “Lecture paused. Press <kbd className="px-1 py-0.5 rounded bg-white border border-neutral-300 font-mono text-[9px]">Space</kbd> or click <strong>Play</strong> to continue.”
              </p>
            ) : (
              <p className="text-neutral-600 text-[11px]">
                “Welcome! Press <strong>Play Masterclass</strong> to begin interactive visual teaching.”
              </p>
            )}
          </div>

          {/* Real-time frequency equalizer animation */}
          <div className="flex items-center justify-between mt-2 px-0.5">
            <div className="flex items-center space-x-1 text-[10px] text-neutral-500 font-mono">
              <Sparkles className="w-3 h-3 text-[#1677ff]" />
              <span className="truncate max-w-[160px]">
                {currentSegmentHeading || "Smartboard"}
              </span>
            </div>

            {isSpeaking && (
              <div className="flex items-center space-x-0.5">
                <span className="w-0.5 h-2.5 bg-[#1677ff] rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-0.5 h-4 bg-[#1677ff] rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-0.5 h-2 bg-[#1677ff] rounded-full animate-bounce [animation-delay:300ms]" />
                <span className="w-0.5 h-3.5 bg-[#1677ff] rounded-full animate-bounce [animation-delay:450ms]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

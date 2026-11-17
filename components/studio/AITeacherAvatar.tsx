"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Volume2, Mic, Pause, Play, CheckCircle2, Award } from "lucide-react";
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
  const [mouthOpen, setMouthOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Dynamic speaking mouth oscillation when audio is playing
  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpen(false);
      return;
    }

    const interval = setInterval(() => {
      setMouthOpen((prev) => !prev);
    }, 180);

    return () => clearInterval(interval);
  }, [isSpeaking]);

  if (isFloating && isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/95 border border-[#e2e5eb] shadow-lg text-xs font-semibold text-[#0d0e11] hover:border-electric transition-all backdrop-blur-md"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>AI Teacher (Click to Expand)</span>
      </button>
    );
  }

  return (
    <div
      className={`relative flex flex-col rounded-2xl border transition-all duration-300 ${
        isFloating
          ? "bg-white/95 backdrop-blur-xl border-[#d8dce6] shadow-[0_16px_40px_rgba(0,0,0,0.12)] p-3.5 max-w-sm"
          : "bg-white border-[#e2e5eb] shadow-xs p-4"
      }`}
    >
      {/* Header Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <span
              className={`block w-2.5 h-2.5 rounded-full ${
                isSpeaking
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                  : status === "paused"
                  ? "bg-amber-400"
                  : "bg-neutral-400"
              }`}
            />
            {isSpeaking && (
              <span className="absolute -inset-1 rounded-full bg-emerald-400 opacity-40 animate-ping" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#0d0e11] flex items-center gap-1.5">
              <span>{teacherName}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-50 text-electric border border-blue-200">
                AI FELLOW
              </span>
            </h4>
            <p className="text-[10px] text-neutral-500 font-medium">
              {isSpeaking
                ? "Explaining on Smartboard"
                : status === "paused"
                ? "Lesson Paused"
                : "Ready to Teach"}
            </p>
          </div>
        </div>

        {isFloating && (
          <button
            onClick={() => setIsMinimized(true)}
            className="text-neutral-400 hover:text-neutral-700 text-xs px-1.5 py-0.5 rounded hover:bg-neutral-100"
            title="Minimize Teacher"
          >
            ✕
          </button>
        )}
      </div>

      {/* Main Teacher Visual Representation */}
      <div className="flex items-start space-x-3.5">
        {/* Animated Teacher Avatar SVG Character */}
        <div className="relative flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-b from-blue-50 to-indigo-100 border border-blue-200/80 p-1 flex items-center justify-center overflow-hidden shadow-xs">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Soft Ambient Background Glow */}
            <circle cx="50" cy="50" r="46" fill="#f0f7ff" />

            {/* Hair Back */}
            <path
              d="M 28 50 C 24 30, 76 30, 72 50 C 72 65, 28 65, 28 50 Z"
              fill="#1e293b"
            />

            {/* Teacher Torso / Blazer */}
            <path
              d="M 20 95 C 20 72, 35 68, 50 68 C 65 68, 80 72, 80 95 Z"
              fill="#1e3a8a"
            />
            {/* White Collar Shirt */}
            <polygon points="50,68 40,78 60,78" fill="#ffffff" />
            <polygon points="50,78 45,95 55,95" fill="#1677ff" />

            {/* Head / Face */}
            <ellipse cx="50" cy="46" rx="20" ry="22" fill="#ffdfba" />

            {/* Hair Front / Bangs */}
            <path
              d="M 30 42 C 32 28, 68 28, 70 42 C 60 35, 40 35, 30 42 Z"
              fill="#0f172a"
            />

            {/* Stylish Teacher Glasses */}
            <rect
              x="33"
              y="40"
              width="14"
              height="10"
              rx="3"
              fill="rgba(255,255,255,0.4)"
              stroke="#0f172a"
              strokeWidth="2"
            />
            <rect
              x="53"
              y="40"
              width="14"
              height="10"
              rx="3"
              fill="rgba(255,255,255,0.4)"
              stroke="#0f172a"
              strokeWidth="2"
            />
            <line x1="47" y1="45" x2="53" y2="45" stroke="#0f172a" strokeWidth="2" />

            {/* Friendly Intelligent Eyes */}
            <circle cx="40" cy="45" r="2.5" fill="#1e293b" />
            <circle cx="60" cy="45" r="2.5" fill="#1e293b" />
            <circle cx="41" cy="44" r="0.8" fill="#ffffff" />
            <circle cx="61" cy="44" r="0.8" fill="#ffffff" />

            {/* Gentle Smile / Speaking Mouth */}
            {mouthOpen ? (
              <ellipse cx="50" cy="58" rx="4" ry="3" fill="#be123c" />
            ) : (
              <path
                d="M 45 57 Q 50 61 55 57"
                stroke="#991b1b"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
              />
            )}

            {/* Teacher's Smart Pointer Pen in Hand */}
            {isSpeaking && (
              <g className="animate-pulse">
                <line
                  x1="76"
                  y1="75"
                  x2="94"
                  y2="35"
                  stroke="#1677ff"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="94" cy="35" r="3" fill="#00e5ff" />
              </g>
            )}
          </svg>

          {/* Small speaking badge */}
          {isSpeaking && (
            <div className="absolute -bottom-1 -right-1 bg-electric text-white p-0.5 rounded-full shadow-xs">
              <Volume2 className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* Dynamic Teacher Dialogue Bubble */}
        <div className="flex-1 min-w-0">
          <div className="relative p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80 text-[11px] text-neutral-800 leading-relaxed font-sans shadow-xs">
            {/* Bubble arrow pointer */}
            <div className="absolute top-3 -left-1.5 w-3 h-3 bg-neutral-50 border-l border-t border-neutral-200/80 rotate-[-45deg]" />

            {isSpeaking ? (
              <div>
                <span className="font-semibold text-electric block mb-0.5 text-[10px] uppercase tracking-wider">
                  Current Demonstration:
                </span>
                <p className="line-clamp-3 text-neutral-700 italic font-serif">
                  “{narration || "Follow the smartboard diagrams carefully as we unpack this concept."}”
                </p>
              </div>
            ) : status === "paused" ? (
              <p className="text-neutral-600">
                “We have paused here. Click <strong className="text-electric">Resume</strong> or press <kbd className="px-1 py-0.5 rounded bg-white border border-neutral-300 font-mono text-[9px]">Space</kbd> whenever you are ready.”
              </p>
            ) : (
              <p className="text-neutral-600">
                “Hello! I will guide you through this lesson with live whiteboard visuals and voice explanation. Click <strong className="text-electric">Play Masterclass</strong> to start!”
              </p>
            )}
          </div>

          {/* Teacher Status Bar */}
          <div className="flex items-center justify-between mt-2 px-1">
            <div className="flex items-center space-x-1.5 text-[10px] text-neutral-500 font-mono">
              <Sparkles className="w-3 h-3 text-electric" />
              <span className="truncate max-w-[170px]">
                {currentSegmentHeading || "Interactive Smartboard"}
              </span>
            </div>

            {isSpeaking && (
              <div className="flex items-center space-x-0.5">
                <span className="w-1 h-2.5 bg-electric rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1 h-3.5 bg-electric rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1 h-2 bg-electric rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

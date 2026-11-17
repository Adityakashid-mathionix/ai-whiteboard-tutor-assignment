"use client";

import React, { useState } from "react";
import { Volume2, ChevronUp, ChevronDown } from "lucide-react";
import { PlaybackStatus } from "@/types/lesson";

interface AITeacherAvatarProps {
  status: PlaybackStatus;
  currentSegmentHeading?: string;
  narration?: string;
  teacherName?: string;
  isFloating?: boolean;
}

/**
 * Minimal teacher avatar that sits on the whiteboard.
 * Clean SVG teacher silhouette with a pointer stick,
 * subtle speaking animation, and live transcript card.
 */
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
        className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-white/95 border border-neutral-200 shadow-lg text-xs font-medium text-[#121316] hover:border-[#1677ff] transition-all backdrop-blur-xl"
      >
        <span className={`w-2 h-2 rounded-full ${isSpeaking ? "bg-[#1677ff] animate-pulse" : "bg-neutral-400"}`} />
        <span className="font-medium text-[11px]">{teacherName}</span>
        <ChevronUp className="w-3 h-3 text-neutral-400" />
      </button>
    );
  }

  return (
    <div
      className={`relative flex items-start space-x-3 rounded-2xl border transition-all duration-300 ${
        isFloating
          ? "bg-white/95 backdrop-blur-2xl border-neutral-200 shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-3 max-w-xs"
          : "bg-white border-[#e6e2d8] shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-3.5"
      }`}
    >
      {/* Teacher Avatar — Clean SVG character */}
      <div className="relative flex-shrink-0">
        <svg
          width="52"
          height="52"
          viewBox="0 0 52 52"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          {/* Background circle */}
          <circle cx="26" cy="26" r="25" fill="#f0f4ff" stroke="#d4deff" strokeWidth="1.5" />

          {/* Head */}
          <circle cx="26" cy="18" r="8" fill="#f5d0a9" />

          {/* Hair */}
          <path d="M18 16c0-5 3.5-8 8-8s8 3 8 8c0 1-0.5 2-1 2.5 0-4-3-7-7-7s-7 3-7 7c-0.5-0.5-1-1.5-1-2.5z" fill="#3d2c1e" />

          {/* Eyes */}
          <circle cx="23" cy="17.5" r="1.2" fill="#1a1a2e" />
          <circle cx="29" cy="17.5" r="1.2" fill="#1a1a2e" />

          {/* Smile */}
          <path d="M23 21.5 Q26 24 29 21.5" stroke="#c27c5a" strokeWidth="1" fill="none" strokeLinecap="round" />

          {/* Body / Shirt */}
          <path d="M18 30 Q18 26 26 26 Q34 26 34 30 L36 44 L16 44 Z" fill="#1677ff" />

          {/* Collar detail */}
          <path d="M23 26 L26 30 L29 26" stroke="#ffffff" strokeWidth="0.8" fill="none" strokeLinecap="round" />

          {/* Teaching pointer arm — slight animation via CSS */}
          <g className={isSpeaking ? "animate-[teacher-point_3s_ease-in-out_infinite]" : ""}>
            <line x1="34" y1="30" x2="44" y2="20" stroke="#f5d0a9" strokeWidth="2.5" strokeLinecap="round" />
            {/* Pointer tip */}
            <circle cx="44" cy="20" r="1.5" fill="#d97706" />
          </g>

          {/* Speaking indicator — subtle mouth animation */}
          {isSpeaking && (
            <ellipse cx="26" cy="22" rx="2" ry="1.2" fill="#c27c5a">
              <animate attributeName="ry" values="1.2;1.8;0.8;1.5;1.2" dur="0.6s" repeatCount="indefinite" />
            </ellipse>
          )}
        </svg>

        {/* Status dot */}
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
            isSpeaking
              ? "bg-[#1677ff]"
              : status === "paused"
              ? "bg-amber-500"
              : "bg-neutral-400"
          }`}
        />
      </div>

      {/* Identity + Live Transcript */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <h4 className="text-xs font-semibold text-[#121316] tracking-tight">
              {teacherName}
            </h4>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#1677ff]/10 text-[#1677ff] border border-[#1677ff]/20">
              TUTOR
            </span>
          </div>

          {isFloating && (
            <button
              onClick={() => setIsMinimized(true)}
              className="p-0.5 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              title="Minimize"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Spoken transcript */}
        <div className="mt-1.5 p-2 rounded-lg bg-[#faf8f5] border border-[#e8e4db] text-[11px] leading-relaxed">
          {isSpeaking ? (
            <p className="line-clamp-2 text-[#121316]">
              {narration || "Follow the whiteboard as we explore this concept."}
            </p>
          ) : status === "paused" ? (
            <p className="text-neutral-500">
              Paused. Press <kbd className="px-1 py-0.5 rounded bg-white border border-neutral-300 font-mono text-[9px]">Space</kbd> to continue.
            </p>
          ) : (
            <p className="text-neutral-500">
              Press <strong>Play</strong> to begin the lesson.
            </p>
          )}
        </div>

        {/* Audio indicator bar */}
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-neutral-400 font-mono truncate max-w-[140px]">
            {currentSegmentHeading || "Ready"}
          </span>

          {isSpeaking && (
            <div className="flex items-center space-x-[3px]">
              {[2, 3.5, 2, 4, 2.5].map((h, i) => (
                <span
                  key={i}
                  className="w-[2px] rounded-full bg-[#1677ff]"
                  style={{
                    height: `${h * 2.5}px`,
                    animation: `eq-bar 0.8s ease-in-out ${i * 0.12}s infinite alternate`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

"use client";

import React from "react";
import { Lesson, PlaybackStatus } from "@/types/lesson";
import { CheckCircle2, Volume2, Clock, Image as ImageIcon } from "lucide-react";

interface LessonOutlineProps {
  lesson: Lesson;
  currentSegmentIndex: number;
  status: PlaybackStatus;
  onSelectSegment: (index: number) => void;
}

export const LessonOutline: React.FC<LessonOutlineProps> = ({
  lesson,
  currentSegmentIndex,
  status,
  onSelectSegment,
}) => {
  return (
    <div className="flex flex-col h-full bg-[#121620] rounded-2xl border border-[#282d3b] shadow-2xl overflow-hidden">
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-[#282d3b] bg-[#141720]">
        <div className="flex items-center justify-between text-[11px] font-mono text-electric mb-2">
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>~{lesson.estimatedDuration || 120}s MASTERCLASS</span>
          </div>
          <span className="text-neutral-400 font-bold font-mono">
            {currentSegmentIndex + 1} / {lesson.segments.length}
          </span>
        </div>
        <h2 className="text-base font-serif font-bold text-[#f6f4ef] line-clamp-2 leading-snug">
          {lesson.title}
        </h2>
        <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed font-sans">
          {lesson.summary}
        </p>
      </div>

      {/* Chapters Timeline List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-[10px] font-mono font-bold tracking-wider text-neutral-400 uppercase">
            Curriculum Roadmap ({lesson.segments.length})
          </span>
          <span className="text-[10px] font-mono text-neutral-500">
            Click to Seek
          </span>
        </div>

        {lesson.segments.map((segment, index) => {
          const isActive = index === currentSegmentIndex;
          const isPast = index < currentSegmentIndex;
          const hasImage = segment.visualActions?.some((a) => a.type === "drawImage");

          return (
            <button
              key={segment.id || index}
              onClick={() => onSelectSegment(index)}
              className={`w-full text-left p-3 rounded-xl transition-all duration-200 border flex items-start space-x-3 group relative ${
                isActive
                  ? "bg-[#181c28] border-electric shadow-[0_0_15px_rgba(22,119,255,0.2)] ring-1 ring-electric/40"
                  : isPast
                  ? "bg-[#141720]/50 border-[#222530] hover:bg-[#181c28] hover:border-[#282d3b] text-neutral-400"
                  : "bg-transparent border-transparent hover:bg-[#181c28] hover:border-[#282d3b] text-neutral-400"
              }`}
            >
              {/* Segment state badge */}
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-mono font-bold transition-all ${
                  isActive
                    ? "bg-electric text-white shadow-[0_0_10px_rgba(22,119,255,0.6)]"
                    : isPast
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    : "bg-[#1e2230] text-neutral-400 group-hover:bg-[#282d3b]"
                }`}
              >
                {isPast ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Title & Narration Preview */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-xs font-medium truncate ${
                      isActive ? "text-[#f6f4ef] font-semibold" : "text-neutral-300 group-hover:text-[#f6f4ef]"
                    }`}
                  >
                    {segment.heading}
                  </h4>
                  {hasImage && (
                    <span
                      title="Includes Educational Image"
                      className="ml-1 text-electric flex-shrink-0"
                    >
                      <ImageIcon className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5 leading-snug">
                  {segment.narration}
                </p>

                {/* Live Speaking Indicator */}
                {isActive && status === "playing" && (
                  <div className="flex items-center space-x-1.5 mt-2 text-[10px] font-mono text-electric">
                    <Volume2 className="w-3 h-3 animate-pulse" />
                    <span>Speaking now...</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

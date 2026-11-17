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
    <div className="flex flex-col h-full bg-white rounded-2xl border border-[#e2e5eb] shadow-[0_4px_25px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-[#f1f3f7] bg-white">
        <div className="flex items-center justify-between text-[11px] font-mono text-electric mb-2">
          <div className="flex items-center space-x-1.5 font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>~{lesson.estimatedDuration || 120}s MASTERCLASS</span>
          </div>
          <span className="text-neutral-500 font-bold font-mono">
            {currentSegmentIndex + 1} / {lesson.segments.length}
          </span>
        </div>
        <h2 className="text-base font-serif font-bold text-[#0d0e11] line-clamp-2 leading-snug">
          {lesson.title}
        </h2>
        <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed font-sans">
          {lesson.summary}
        </p>
      </div>

      {/* Chapters Timeline List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-[10px] font-mono font-bold tracking-wider text-neutral-400 uppercase">
            Curriculum Roadmap ({lesson.segments.length})
          </span>
          <span className="text-[10px] font-mono text-neutral-400">
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
              className={`w-full text-left p-3.5 rounded-xl transition-all duration-200 border flex items-start space-x-3 group relative ${
                isActive
                  ? "bg-electric/5 border-electric shadow-xs ring-1 ring-electric/30"
                  : isPast
                  ? "bg-neutral-50/70 border-neutral-200 hover:bg-neutral-100/70 hover:border-neutral-300 text-neutral-600"
                  : "bg-transparent border-transparent hover:bg-neutral-50 hover:border-neutral-200 text-neutral-600"
              }`}
            >
              {/* Segment state badge */}
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-mono font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-electric text-white shadow-xs scale-105"
                    : isPast
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200"
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
                      isActive ? "text-[#0d0e11] font-semibold" : "text-neutral-700 group-hover:text-[#0d0e11]"
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
                  <div className="flex items-center space-x-1.5 mt-2 text-[10px] font-mono text-electric font-semibold">
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

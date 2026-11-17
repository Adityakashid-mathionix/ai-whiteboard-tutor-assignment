"use client";

import React, { useState } from "react";
import { Lesson, LessonSegment, PlaybackStatus } from "@/types/lesson";
import { FollowUpChat } from "@/components/followup/FollowUpChat";
import { BookOpen, MessageSquare } from "lucide-react";

interface TutorPanelProps {
  lesson: Lesson;
  currentSegment: LessonSegment | null;
  currentSegmentIndex: number;
  status: PlaybackStatus;
  apiKey?: string;
  model?: string;
}

export const TutorPanel: React.FC<TutorPanelProps> = ({
  lesson,
  currentSegment,
  currentSegmentIndex,
  apiKey,
  model,
}) => {
  const [activeTab, setActiveTab] = useState<"notes" | "chat">("notes");

  const takeaways = lesson.keyTakeaways?.filter(Boolean) ?? [];

  const tabs = [
    { id: "notes" as const, label: "Notes", Icon: BookOpen },
    { id: "chat" as const, label: "Ask", Icon: MessageSquare },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-paper shadow-paper">
      <div className="flex items-center gap-1 border-b border-border p-2">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-mono text-[11px] transition-colors ${
              activeTab === id
                ? "bg-electric text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {activeTab === "notes" ? (
          <div className="space-y-5">
            <section>
              <p className="eyebrow">
                chapter {currentSegmentIndex + 1} · what is being said
              </p>
              <h3 className="handwritten mt-1 text-2xl leading-tight">
                {currentSegment?.heading || lesson.title}
              </h3>
              <p className="prose-paper mt-2 text-[14px] leading-relaxed">
                {currentSegment?.narration || lesson.summary}
              </p>
            </section>

            {currentSegment?.keyTakeaway && (
              <section className="rounded-lg border-l-2 border-[#d97706] bg-sticky-yellow/40 px-3 py-2.5">
                <p className="eyebrow text-[#92400e]">takeaway</p>
                <p className="mt-1 text-[13px] leading-snug text-[#4a2d05]">
                  {currentSegment.keyTakeaway}
                </p>
              </section>
            )}

            {takeaways.length > 0 && (
              <section>
                <p className="eyebrow">the whole lesson in three lines</p>
                <ol className="mt-2 space-y-2">
                  {takeaways.map((point, idx) => (
                    <li key={idx} className="flex gap-2.5 text-[13px] leading-snug">
                      <span className="font-mono text-[11px] text-electric">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="text-muted-foreground">{point}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <section className="border-t border-border pt-4">
              <p className="eyebrow">about this lesson</p>
              <dl className="mt-2 space-y-1.5 font-mono text-[11px] text-muted-foreground">
                <div className="flex justify-between gap-3">
                  <dt>chapters</dt>
                  <dd className="text-foreground">{lesson.segments.length}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>depth</dt>
                  <dd className="text-foreground">{lesson.learningLevel || "beginner"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>length</dt>
                  <dd className="text-foreground">~{lesson.estimatedDuration || 120}s</dd>
                </div>
              </dl>
            </section>
          </div>
        ) : (
          <FollowUpChat
            lesson={lesson}
            currentSegmentHeading={currentSegment?.heading}
            apiKey={apiKey}
            model={model}
          />
        )}
      </div>
    </div>
  );
};

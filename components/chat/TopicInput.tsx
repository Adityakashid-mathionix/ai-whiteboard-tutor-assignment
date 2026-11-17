"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Pencil } from "lucide-react";
import { LEARNING_LEVELS } from "@/lib/learning-levels";

interface TopicInputProps {
  onGenerate?: (topic: string, level: string) => void;
  isLoading?: boolean;
}

export const TopicInput: React.FC<TopicInputProps> = ({ onGenerate, isLoading = false }) => {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("beginner");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isLoading) return;

    if (onGenerate) {
      onGenerate(topic.trim(), level);
      return;
    }

    const params = new URLSearchParams({ topic: topic.trim(), level });
    router.push(`/studio?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center rounded-xl bg-paper border border-border p-2 shadow-paper transition-all duration-300 focus-within:border-electric focus-within:shadow-electric">
          <span className="pl-3 pr-2 text-electric">
            <Pencil className="w-5 h-5" />
          </span>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Teach me anything — photosynthesis, TCP handshakes, the French Revolution…"
            disabled={isLoading}
            aria-label="Lesson topic"
            className="flex-1 bg-transparent px-2 py-3 text-sm text-foreground placeholder-muted-foreground/70 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading || !topic.trim()}
            className="btn-interactive flex items-center gap-2 rounded-lg bg-electric px-5 py-3 font-mono text-xs font-semibold text-white shadow-paper disabled:opacity-40 flex-shrink-0 hover:bg-electric-hover"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparing…</span>
              </>
            ) : (
              <>
                <span>Start the lesson</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
        <div className="flex items-center gap-2">
          <span className="eyebrow">depth</span>
          <div className="flex items-center gap-1.5">
            {LEARNING_LEVELS.map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                title={lvl.desc}
                onClick={() => setLevel(lvl.id)}
                className={`rounded-full px-3 py-1 font-mono text-[11px] transition-all ${
                  level === lvl.id
                    ? "bg-electric text-white shadow-paper"
                    : "border border-border bg-paper text-muted-foreground hover:text-foreground"
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

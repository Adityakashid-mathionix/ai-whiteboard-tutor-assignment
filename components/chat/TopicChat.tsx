"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, GraduationCap, Loader2 } from "lucide-react";
import { LEARNING_LEVELS } from "@/lib/learning-levels";

interface ChatLine {
  id: string;
  role: "tutor" | "student";
  text: string;
}

const OPENING: ChatLine = {
  id: "open",
  role: "tutor",
  text: "Hi — I'm your whiteboard tutor. Tell me what you want to understand and I'll teach it the way a person would: out loud, step by step, drawing it as I go. What's the topic?",
};

const SUGGESTIONS = [
  "How a jet engine works",
  "Why the sky is blue",
  "How HTTPS keeps data private",
  "The water cycle",
];

/**
 * The entry point to a lesson: a conversation rather than a search box.
 *
 * The tutor's lines here are interface copy, not model output — the real
 * teaching starts once the studio opens and the lesson is generated.
 */
export const TopicChat: React.FC = () => {
  const router = useRouter();

  const [lines, setLines] = useState<ChatLine[]>([OPENING]);
  const [input, setInput] = useState("");
  const [level, setLevel] = useState("beginner");
  const [isStarting, setIsStarting] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [lines, isStarting]);

  const start = (rawTopic: string) => {
    const topic = rawTopic.trim();
    if (!topic || isStarting) return;

    setInput("");
    setIsStarting(true);
    setLines((prev) => [
      ...prev,
      { id: `student-${Date.now()}`, role: "student", text: topic },
      {
        id: `tutor-${Date.now()}`,
        role: "tutor",
        text: `Good one. Give me a moment to plan the chapters for “${topic}”, then I'll take you through it on the board.`,
      },
    ]);

    // Let the reply land before the studio takes over the screen.
    const params = new URLSearchParams({ topic, level });
    window.setTimeout(() => router.push(`/studio?${params.toString()}`), 900);
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="paper-card overflow-hidden">
        {/* Thread */}
        <div
          ref={scrollRef}
          className="max-h-[340px] min-h-[220px] space-y-3 overflow-y-auto p-4 sm:p-5"
          aria-live="polite"
          aria-label="Conversation with the tutor"
        >
          {lines.map((line) =>
            line.role === "tutor" ? (
              <div key={line.id} className="flex items-start gap-2.5">
                <span className="mt-0.5 grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg bg-electric/10 text-electric ring-1 ring-electric/20">
                  <GraduationCap className="h-3.5 w-3.5" />
                </span>
                <p className="prose-paper max-w-[85%] rounded-xl rounded-tl-sm bg-paper-warm px-3.5 py-2.5 text-[14px] leading-relaxed">
                  {line.text}
                </p>
              </div>
            ) : (
              <div key={line.id} className="flex justify-end">
                <p className="max-w-[85%] rounded-xl rounded-tr-sm bg-electric px-3.5 py-2.5 text-[14px] text-white">
                  {line.text}
                </p>
              </div>
            )
          )}

          {isStarting && (
            <div className="flex items-center gap-2 pl-10 font-mono text-[11px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin text-electric" />
              opening the board…
            </div>
          )}
        </div>

        {/* Quick topics, shown until the student says something */}
        {lines.length === 1 && (
          <div className="flex flex-wrap gap-1.5 border-t border-border px-4 py-3 sm:px-5">
            {SUGGESTIONS.map((topic) => (
              <button
                key={topic}
                onClick={() => start(topic)}
                className="rounded-full border border-border bg-paper px-3 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-electric/40 hover:text-foreground"
              >
                {topic}
              </button>
            ))}
          </div>
        )}

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start(input);
          }}
          className="border-t border-border bg-paper-warm/60 p-3 sm:p-4"
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isStarting}
              placeholder="Ask me to teach you anything…"
              aria-label="Topic to learn"
              className="min-w-0 flex-1 bg-transparent px-1.5 py-2 text-[15px] text-foreground placeholder-muted-foreground/70 focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isStarting || !input.trim()}
              aria-label="Start the lesson"
              className="btn-interactive grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-electric text-white shadow-paper disabled:opacity-35"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 flex items-center gap-2 border-t border-border/70 pt-2.5">
            <span className="eyebrow">depth</span>
            {LEARNING_LEVELS.map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                title={lvl.desc}
                onClick={() => setLevel(lvl.id)}
                className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] transition-colors ${
                  level === lvl.id
                    ? "bg-electric text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </form>
      </div>

      <p className="mt-3 text-center font-mono text-[11px] text-muted-foreground">
        no sign-up · voice runs in your browser · bring your own API key if you want
      </p>
    </div>
  );
};

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, ArrowRight, Loader2 } from "lucide-react";

interface TopicInputProps {
  onGenerate?: (topic: string, level?: string) => void;
  isLoading?: boolean;
}

export const TopicInput: React.FC<TopicInputProps> = ({ onGenerate, isLoading = false }) => {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isLoading) return;

    if (onGenerate) {
      onGenerate(topic.trim(), level);
    } else {
      router.push(`/studio?topic=${encodeURIComponent(topic.trim())}&level=${level}`);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center rounded-2xl bg-[#10121a] border border-[#262a3a] shadow-2xl p-2 focus-within:border-[#0066ff] focus-within:ring-2 focus-within:ring-[#0066ff]/30 transition-all duration-300">
          <div className="pl-3 pr-2 text-[#00d2ff]">
            <Compass className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter any educational topic (e.g. How the Human Heart Works, Black Holes, TCP/IP)..."
            disabled={isLoading}
            className="flex-1 bg-transparent px-2 py-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading || !topic.trim()}
            className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-[#0066ff] hover:bg-[#0052cc] text-white font-semibold text-xs shadow-lg shadow-[#0066ff]/40 disabled:opacity-40 transition-all duration-200 active:scale-95 flex-shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <span>Launch Lesson</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Learning Depth Level Selector */}
      <div className="flex items-center justify-center space-x-2 text-xs">
        <span className="text-neutral-400 text-[11px] font-mono mr-1">Depth:</span>
        {[
          { id: "beginner", label: "Foundational", desc: "Intuitive analogies" },
          { id: "intermediate", label: "Core Academic", desc: "Mechanisms & formulas" },
          { id: "advanced", label: "Deep Dive", desc: "Technical architecture" },
        ].map((lvl) => (
          <button
            key={lvl.id}
            type="button"
            onClick={() => setLevel(lvl.id as any)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              level === lvl.id
                ? "bg-[#0066ff]/20 text-[#00d2ff] border border-[#0066ff]/50 shadow-sm"
                : "text-neutral-400 hover:text-neutral-200 bg-[#10121a] border border-[#222533]"
            }`}
          >
            {lvl.label}
          </button>
        ))}
      </div>
    </div>
  );
};

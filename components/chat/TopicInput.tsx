"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Loader2, Compass, Layers } from "lucide-react";

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
        <div className="relative flex items-center rounded-2xl bg-[#0f172a] border border-slate-700 shadow-2xl p-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-300">
          <div className="pl-3 pr-2 text-blue-400">
            <Compass className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter any educational topic (e.g. How the Human Heart Works, Black Holes, TCP/IP)..."
            disabled={isLoading}
            className="flex-1 bg-transparent px-2 py-3 text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading || !topic.trim()}
            className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 disabled:opacity-40 transition-all duration-200 active:scale-95 flex-shrink-0"
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
        <span className="text-slate-400 text-[11px] font-mono mr-1">Depth:</span>
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
                ? "bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800"
            }`}
          >
            {lvl.label}
          </button>
        ))}
      </div>
    </div>
  );
};

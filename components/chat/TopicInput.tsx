"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";

interface TopicInputProps {
  onGenerate?: (topic: string) => void;
  isLoading?: boolean;
}

export const TopicInput: React.FC<TopicInputProps> = ({ onGenerate, isLoading = false }) => {
  const [topic, setTopic] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isLoading) return;

    if (onGenerate) {
      onGenerate(topic.trim());
    } else {
      router.push(`/studio?topic=${encodeURIComponent(topic.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl p-2 focus-within:border-sky-500/80 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all duration-300">
        <div className="pl-3 pr-2 text-sky-400">
          <Sparkles className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter any topic (e.g. How the Human Heart Works, Quantum Entanglement)..."
          disabled={isLoading}
          className="flex-1 bg-transparent px-2 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-semibold text-xs shadow-lg shadow-sky-500/20 disabled:opacity-40 transition-all duration-200 active:scale-95 flex-shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <span>Generate Lesson</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};

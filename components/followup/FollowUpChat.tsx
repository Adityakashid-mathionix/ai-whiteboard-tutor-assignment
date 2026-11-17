"use client";

import React, { useState, useRef, useEffect } from "react";
import { Lesson, ChatMessage } from "@/types/lesson";
import { Send, Bot, User, Sparkles, Loader2, AlertCircle } from "lucide-react";

interface FollowUpChatProps {
  lesson: Lesson;
  currentSegmentHeading?: string;
  apiKey?: string;
  model?: string;
}

export const FollowUpChat: React.FC<FollowUpChatProps> = ({
  lesson,
  currentSegmentHeading,
  apiKey,
  model,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "assistant",
      content: `Hello! I'm your AI whiteboard tutor for "${lesson.title}". What would you like to explore deeper or clarify?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ask-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-nvidia-api-key": apiKey } : {}),
        },
        body: JSON.stringify({
          question: textToSend.trim(),
          topic: lesson.topic,
          lesson,
          history: messages,
          apiKey,
          model,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to get an answer from the tutor.");
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      console.error("Chat error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  // Quick prompt chips
  const suggestedQuestions = [
    `Can you provide an intuitive real-world analogy?`,
    currentSegmentHeading
      ? `Can you explain "${currentSegmentHeading}" more simply?`
      : `Why is this concept important?`,
    `What are the most common misconceptions?`,
  ];

  return (
    <div className="flex flex-col h-full min-h-[360px]">
      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-2.5 text-xs ${
              msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                msg.role === "user"
                  ? "bg-sky-600 text-white"
                  : "bg-indigo-600/80 text-white"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-3.5 h-3.5" />
              ) : (
                <Bot className="w-3.5 h-3.5" />
              )}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                msg.role === "user"
                  ? "bg-sky-600 text-white rounded-tr-none"
                  : "bg-slate-950/70 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-line"
              }`}
            >
              {msg.content}
              <div
                className={`text-[9px] mt-1 ${
                  msg.role === "user" ? "text-sky-200" : "text-slate-500"
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-indigo-400 bg-indigo-950/30 border border-indigo-900/40 p-2.5 rounded-xl w-fit">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>Tutor is formulating an explanation...</span>
          </div>
        )}

        {error && (
          <div className="flex items-start space-x-2 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 p-2.5 rounded-xl">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
          </div>
        )}
      </div>

      {/* Suggested question chips */}
      {messages.length <= 3 && !isLoading && (
        <div className="py-2 flex flex-wrap gap-1.5">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 transition-colors flex items-center space-x-1 text-left"
            >
              <Sparkles className="w-2.5 h-2.5 text-sky-400" />
              <span className="truncate max-w-[200px]">{q}</span>
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="pt-2 border-t border-slate-800 flex items-center space-x-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask tutor a follow-up question..."
          disabled={isLoading}
          className="flex-1 bg-slate-950/80 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 disabled:opacity-40 transition-colors flex items-center justify-center shadow-md shadow-sky-500/20"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

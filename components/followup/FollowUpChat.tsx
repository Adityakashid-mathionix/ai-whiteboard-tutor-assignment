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
      content: `Hello! I'm Dr. Maya Chen, your AI whiteboard tutor for "${lesson.title}". What would you like to explore deeper or clarify?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

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

  const suggestedQuestions = [
    `Can you provide an intuitive real-world analogy?`,
    currentSegmentHeading
      ? `Can you explain "${currentSegmentHeading}" more simply?`
      : `Why is this concept important?`,
    `What are common misconceptions about this?`,
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
                  ? "bg-electric text-white"
                  : "bg-electric/10 text-electric border border-electric/25"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-3.5 h-3.5" />
              ) : (
                <Bot className="w-3.5 h-3.5" />
              )}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed font-sans ${
                msg.role === "user"
                  ? "bg-electric text-white rounded-tr-none font-medium shadow-xs"
                  : "bg-neutral-100 border border-neutral-200 text-[#0d0e11] rounded-tl-none whitespace-pre-line"
              }`}
            >
              {msg.content}
              <div
                className={`text-[9px] font-mono mt-1 ${
                  msg.role === "user" ? "text-blue-100" : "text-neutral-400"
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-electric bg-electric/10 border border-electric/20 p-2.5 rounded-xl w-fit font-mono">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-electric" />
            <span>Dr. Maya is formulating a Socratic explanation...</span>
          </div>
        )}

        {error && (
          <div className="flex items-start space-x-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl font-mono">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span className="flex-1 font-sans">{error}</span>
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
              className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 transition-colors flex items-center space-x-1 text-left shadow-xs active:scale-95"
            >
              <Sparkles className="w-2.5 h-2.5 text-electric" />
              <span className="truncate max-w-[210px]">{q}</span>
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
        className="pt-2 border-t border-[#f1f3f7] flex items-center space-x-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Dr. Maya a follow-up question..."
          disabled={isLoading}
          className="flex-1 bg-neutral-50 border border-neutral-200 focus:border-electric rounded-xl px-3.5 py-2 text-xs text-[#0d0e11] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-electric/20 transition-all disabled:opacity-50 font-sans"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-2 rounded-xl bg-electric hover:bg-[#0958d9] text-white disabled:opacity-40 transition-all flex items-center justify-center shadow-xs active:scale-95"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

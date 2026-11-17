import React from "react";
import Link from "next/link";
import { TopicInput } from "@/components/chat/TopicInput";
import { SuggestedTopics } from "@/components/chat/SuggestedTopics";
import {
  Sparkles,
  Volume2,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  Play,
  PenTool,
  Compass,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col justify-between selection:bg-blue-500/30 selection:text-blue-200">
      {/* Top Navbar */}
      <header className="px-6 py-4 border-b border-slate-800 bg-[#0f172a]/90 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-white block leading-tight">
              Braynix Studios
            </span>
            <span className="text-[10px] text-slate-400 font-mono leading-none">
              AI Whiteboard Tutor Platform
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/studio?exemplar=heart"
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-xs text-blue-400 border border-blue-500/30 transition-all shadow-sm font-medium"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Launch Studio</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 flex flex-col items-center justify-center w-full">
        {/* Assignment Pill Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-900 border border-blue-500/30 text-blue-400 text-xs font-medium mb-6 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Braynix Studios — Autonomous Whiteboard Masterclass</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-center tracking-tight text-white max-w-4xl leading-[1.12]">
          The AI Tutor that{" "}
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-300 bg-clip-text text-transparent">
            Speaks, Sketches, and Reasons.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 text-center max-w-2xl mt-5 leading-relaxed font-sans">
          Enter any educational or technical concept. An autonomous AI tutor designs a structured masterclass, narrates with synchronized voice, illustrates high-contrast SVG diagrams on a digital smartboard, and answers your follow-up questions.
        </p>

        {/* Topic Input Bar */}
        <div className="w-full mt-8">
          <TopicInput />
        </div>

        {/* Curated Topics Showcase */}
        <SuggestedTopics />

        {/* Production Architecture & Engineering Guarantee */}
        <div className="w-full max-w-5xl mt-20 pt-12 border-t border-slate-800">
          <div className="text-center mb-8">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Production Architecture & Pedagogical Engine
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Built with server-side NVIDIA NIM inference, synchronized browser SpeechSynthesis, and vector smartboard engine
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-2.5 shadow-lg">
              <div className="w-9 h-9 rounded-xl bg-blue-950/80 text-blue-400 flex items-center justify-center border border-blue-800/40 shadow-inner">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">NVIDIA NIM AI Core</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Powered by server-side NVIDIA Nemotron 3.5 Lightning inference. Generates strictly typed, Zod-validated lesson plans with SVG drawing coordinates in sub-4-second response times.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-2.5 shadow-lg">
              <div className="w-9 h-9 rounded-xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center border border-cyan-800/40 shadow-inner">
                <Volume2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Event-Driven Speech Sync</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Browser Web Speech API (SpeechSynthesisUtterance) engine synchronized segment-by-segment with visual whiteboard state. Supports play, pause, resume, seek, and speed multipliers.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-2.5 shadow-lg">
              <div className="w-9 h-9 rounded-xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center border border-emerald-800/40 shadow-inner">
                <PenTool className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Interactive Smartboard</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Warm-white 1000×600 smartboard canvas with zoom, pan, teacher laser pointer, clickable concept inspection tooltips, and an independent student annotation layer with pen, highlighter, and eraser.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#0f172a]/90 px-6 py-6 text-xs text-slate-500 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span>Braynix Studios Assignment</span>
          <span>•</span>
          <span className="text-slate-400 font-mono">Autonomous AI Whiteboard Tutor</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="https://github.com/Braynix-Studios/ai-whiteboard-tutor-assignment"
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-300 transition-colors"
          >
            Assignment Repository
          </Link>
          <Link
            href="/studio?exemplar=heart"
            className="text-blue-400 hover:text-blue-300 font-semibold"
          >
            Launch Studio →
          </Link>
        </div>
      </footer>
    </div>
  );
}

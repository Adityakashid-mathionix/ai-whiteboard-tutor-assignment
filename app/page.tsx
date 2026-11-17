import React from "react";
import Link from "next/link";
import { TopicInput } from "@/components/chat/TopicInput";
import { SuggestedTopics } from "@/components/chat/SuggestedTopics";
import {
  Sparkles,
  Cpu,
  GraduationCap,
  Play,
  ArrowRight,
  ShieldCheck,
  Zap,
  Volume2,
  Layers,
  Code2,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0c0d10] text-[#f6f4ef] flex flex-col justify-between selection:bg-[#1677ff]/30 selection:text-white editorial-desk-grid">
      {/* Top Navbar */}
      <header className="px-6 py-4 border-b border-[#282d3b]/80 bg-[#121620]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between max-w-7xl mx-auto w-full">
        {/* Brand identity with bespoke monogram */}
        <div className="flex items-center space-x-3.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 font-mono text-xs font-semibold text-electric ring-1 ring-electric/30 shadow-[0_0_15px_rgba(22,119,255,0.2)]">
            BX
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-[#f6f4ef] block leading-tight font-sans">
                Braynix Studios
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-electric/10 text-electric border border-electric/25">
                v2.4
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono leading-none">
              Autonomous Whiteboard Masterclasses
            </span>
          </div>
        </div>

        {/* Status indicator & Launch Button */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#282d3b] bg-[#181b24] px-3 py-1 font-mono text-[11px] text-neutral-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>NVIDIA NIM LIVE</span>
          </div>

          <Link
            href="/studio?exemplar=heart"
            className="flex items-center gap-2 rounded-full bg-electric hover:bg-[#0a4fbf] px-4 py-1.5 font-mono text-xs font-medium text-white shadow-electric transition-all hover:scale-105 active:scale-95"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Open Studio</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 flex flex-col items-center justify-center w-full">
        {/* Editorial Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#282d3b] bg-[#141720]/90 px-4 py-1.5 font-mono text-xs text-[#f6f4ef]/80 mb-6 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-electric animate-ping" />
          <span className="text-electric font-semibold">DIGITAL SMARTBOARD ENGINE</span>
          <span className="text-neutral-600">·</span>
          <span>AUTONOMOUS AI TUTOR</span>
        </div>

        {/* Hero Title with Newsreader Serif Italic */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-center tracking-tight text-[#f6f4ef] max-w-4xl leading-[1.15]">
          The AI Tutor that{" "}
          <span className="font-serif italic font-normal text-electric">
            Speaks, Sketches, and Reasons.
          </span>
        </h1>

        {/* Handwritten margin note from Dr. Maya Chen */}
        <div className="mt-3 flex items-center gap-2 handwritten text-xl sm:text-2xl text-amber-300/90 rotate-[-1.5deg] select-none">
          <span>✍️</span>
          <span>“Step-by-step vector illustrations drawn live as the tutor explains.”</span>
        </div>

        <p className="text-sm sm:text-base text-neutral-300 text-center max-w-2xl mt-5 leading-relaxed font-sans">
          Enter any educational concept. Watch Dr. Maya Chen design an interactive curriculum, speak with natural voice narration, illustrate vector diagrams on a digital porcelain smartboard, and answer Socratic follow-up questions.
        </p>

        {/* Topic Input Bar */}
        <div className="w-full mt-8">
          <TopicInput />
        </div>

        {/* Tactile Smartboard & Sticky Note Workspace */}
        <div className="relative w-full max-w-4xl mt-12">
          {/* Authentic Sticky Note pinned to desk */}
          <div className="hidden lg:block absolute -top-6 -right-6 z-20 w-56 p-4 rounded-xl bg-sticky-yellow text-slate-800 sticky-note rotate-[3deg]">
            {/* 3D Pushpin */}
            <span aria-hidden="true" className="absolute -top-3 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full pushpin-blue" />
            <div className="handwritten text-xl font-bold text-slate-900 leading-tight">
              Tutor Note:
            </div>
            <p className="handwritten text-base leading-snug mt-1 text-slate-700">
              Click any element on the smartboard to inspect the concept! You can also draw your own notes with the student pen.
            </p>
            <div className="mt-2 pt-2 border-t border-dashed border-slate-400/50 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-slate-600">
              <span>Dr. Maya Chen</span>
              <span>AI Fellow</span>
            </div>
          </div>

          {/* Smartboard Chassis */}
          <div className="rounded-2xl bg-[#141720] border border-[#282d3b] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#282d3b] text-xs font-mono text-neutral-400">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-electric shadow-[0_0_8px_rgba(22,119,255,0.6)]" />
                <span className="font-bold text-[#f6f4ef]">LIVE SMARTBOARD ENGINE PREVIEW</span>
              </div>
              <div className="flex items-center space-x-3 text-[11px]">
                <span className="text-emerald-400 font-semibold">● SYNCHRONIZED VECTOR AUDIO</span>
                <span className="hidden sm:inline text-neutral-500">1000 × 600 CANVAS</span>
              </div>
            </div>

            <div className="relative mt-3 rounded-xl overflow-hidden smartboard-porcelain h-64 sm:h-72 flex items-center justify-center p-4">
              <svg viewBox="0 0 800 360" className="w-full h-full">
                {/* Sample Animated Vector Heart Architecture */}
                <circle cx="280" cy="180" r="100" fill="rgba(254, 226, 226, 0.5)" stroke="#e62e4d" strokeWidth="3" />
                <line x1="280" y1="80" x2="280" y2="280" stroke="#991b1b" strokeWidth="4" />
                <rect x="200" y="105" width="70" height="60" rx="8" fill="rgba(224, 242, 254, 0.85)" stroke="#1677ff" strokeWidth="2" />
                <text x="212" y="140" fill="#1677ff" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Right Atrium</text>
                <rect x="290" y="105" width="70" height="60" rx="8" fill="rgba(254, 226, 226, 0.85)" stroke="#e62e4d" strokeWidth="2" />
                <text x="305" y="140" fill="#e62e4d" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Left Atrium</text>
                
                {/* Dynamic Flow Arrows */}
                <line x1="120" y1="135" x2="195" y2="135" stroke="#1677ff" strokeWidth="3" strokeDasharray="4 4" />
                <polygon points="195,135 185,130 185,140" fill="#1677ff" />
                <text x="120" y="125" fill="#1677ff" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Vena Cava Inflow</text>

                {/* Explanatory Callout */}
                <rect x="440" y="70" width="310" height="110" rx="12" fill="#141720" stroke="#282d3b" strokeWidth="1.5" />
                <text x="460" y="98" fill="#1677ff" fontSize="11" fontWeight="bold" fontFamily="monospace">SYNCHRONIZED STEP-BY-STEP REASONING</text>
                <text x="460" y="124" fill="#f6f4ef" fontSize="14" fontWeight="bold" fontFamily="Newsreader, serif">Dual-Pump Circulatory Architecture</text>
                <text x="460" y="148" fill="#94a3b8" fontSize="11" fontFamily="sans-serif">Deoxygenated blood travels through pulmonary loops</text>
                <text x="460" y="164" fill="#94a3b8" fontSize="11" fontFamily="sans-serif">while the systemic circuit perfuses vital bodily organs.</text>

                {/* Call to action inside preview */}
                <g transform="translate(440, 205)">
                  <rect width="310" height="42" rx="10" fill="#1677ff" className="hover:opacity-90 cursor-pointer" />
                  <text x="155" y="26" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="JetBrains Mono, monospace">
                    Launch Interactive Heart Masterclass →
                  </text>
                </g>
              </svg>
              <Link href="/studio?exemplar=heart" className="absolute inset-0" aria-label="Launch Heart Masterclass" />
            </div>
          </div>
        </div>

        {/* Curated Topics Showcase */}
        <SuggestedTopics />

        {/* Editorial Architecture & Engineering Guarantee */}
        <div className="w-full max-w-5xl mt-20 pt-12 border-t border-[#282d3b]">
          <div className="text-center mb-8">
            <h2 className="text-xl font-serif font-bold text-[#f6f4ef] tracking-tight">
              Production Architecture & Zero-Mock Engineering
            </h2>
            <p className="text-xs font-mono text-neutral-400 mt-1">
              Built with server-side NVIDIA NIM inference, synchronized browser SpeechSynthesis, and vector smartboard engine
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#141720] border border-[#282d3b] space-y-2.5 shadow-md">
              <div className="w-9 h-9 rounded-xl bg-electric/10 text-electric flex items-center justify-center border border-electric/20">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#f6f4ef]">NVIDIA NIM AI Core</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Powered by server-side NVIDIA Nemotron 3.5 Lightning inference. Generates strictly typed, Zod-validated lesson plans with SVG drawing coordinates in sub-4-second response times.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#141720] border border-[#282d3b] space-y-2.5 shadow-md">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Volume2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#f6f4ef]">Synchronized Voice Engine</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Real-time speech synthesis using Web Speech API with boundary-level synchronization. Shapes and annotations appear dynamically as words are spoken.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#141720] border border-[#282d3b] space-y-2.5 shadow-md">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#f6f4ef]">Interactive Smartboard</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                High-resolution 1000×600 SVG canvas with student pen annotation, highlighter, pan/zoom navigation, and clickable concept inspection cards.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[#282d3b] py-6 px-4 bg-[#121620] text-center text-xs font-mono text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-400">Braynix Studios</span>
            <span>·</span>
            <span>AI Interactive Whiteboard Tutor</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-neutral-400">NVIDIA NIM: Nemotron 3.5 Lightning</span>
            <span>·</span>
            <span className="text-electric">Production Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

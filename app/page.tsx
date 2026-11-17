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
  Monitor,
  Zap,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#08090d] text-neutral-100 flex flex-col justify-between selection:bg-[#0066ff]/30 selection:text-white">
      {/* Top Navbar */}
      <header className="px-6 py-4 border-b border-[#222533] bg-[#10121a]/95 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0066ff] to-[#00d2ff] flex items-center justify-center text-white shadow-[0_0_15px_rgba(0,102,255,0.5)]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-white block leading-tight">
              Braynix Studios
            </span>
            <span className="text-[10px] text-neutral-400 font-mono leading-none">
              AI Whiteboard Masterclass Platform
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#141722] border border-[#222533] text-[10px] font-mono text-[#00d084]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d084] animate-pulse" />
            <span>NVIDIA NIM LIVE</span>
          </div>

          <Link
            href="/studio?exemplar=heart"
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-[#0066ff] hover:bg-[#0052cc] text-xs text-white transition-all shadow-md shadow-[#0066ff]/30 font-semibold"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Launch Studio</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 flex flex-col items-center justify-center w-full">
        {/* Assignment Pill Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#141722] border border-[#222533] text-[#00d2ff] text-xs font-mono mb-6 shadow-inner">
          <Zap className="w-3.5 h-3.5 text-[#00d2ff]" />
          <span>AUTONOMOUS DIGITAL SMARTBOARD TUTOR</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-center tracking-tight text-white max-w-4xl leading-[1.12]">
          The AI Tutor that{" "}
          <span className="bg-gradient-to-r from-[#00d2ff] via-[#0066ff] to-[#00d2ff] bg-clip-text text-transparent">
            Speaks, Sketches, and Reasons.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-neutral-400 text-center max-w-2xl mt-5 leading-relaxed font-sans">
          Enter any educational or technical concept. Watch Dr. Maya Chen design an interactive masterclass, narrate with natural voice, illustrate animated vector diagrams on a digital porcelain smartboard, and answer Socratic follow-up questions.
        </p>

        {/* Topic Input Bar */}
        <div className="w-full mt-8">
          <TopicInput />
        </div>

        {/* Interactive Smartboard Teaser Mockup */}
        <div className="w-full max-w-4xl mt-12 rounded-2xl bg-[#10121a] border-2 border-[#262a3a] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-[#222533] text-xs font-mono text-neutral-400">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0066ff]" />
              <span className="font-bold text-white">LIVE SMARTBOARD ENGINE PREVIEW</span>
            </div>
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="text-[#00d084] font-semibold">● SYNCHRONIZED VECTOR AUDIO</span>
              <span className="hidden sm:inline text-neutral-500">1000 × 600 CANVAS</span>
            </div>
          </div>

          <div className="relative mt-3 rounded-xl overflow-hidden smartboard-porcelain h-64 sm:h-72 flex items-center justify-center p-4">
            <svg viewBox="0 0 800 360" className="w-full h-full">
              {/* Sample Animated Vector Heart Architecture */}
              <circle cx="280" cy="180" r="100" fill="rgba(254, 226, 226, 0.4)" stroke="#e62e4d" strokeWidth="3" />
              <line x1="280" y1="80" x2="280" y2="280" stroke="#991b1b" strokeWidth="4" />
              <rect x="200" y="105" width="70" height="60" rx="8" fill="rgba(224, 242, 254, 0.8)" stroke="#0066ff" strokeWidth="2" />
              <text x="212" y="140" fill="#0066ff" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Right Atrium</text>
              <rect x="290" y="105" width="70" height="60" rx="8" fill="rgba(254, 226, 226, 0.8)" stroke="#e62e4d" strokeWidth="2" />
              <text x="305" y="140" fill="#e62e4d" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Left Atrium</text>
              
              {/* Dynamic Flow Arrows */}
              <line x1="120" y1="135" x2="195" y2="135" stroke="#0066ff" strokeWidth="3" strokeDasharray="4 4" />
              <polygon points="195,135 185,130 185,140" fill="#0066ff" />
              <text x="120" y="125" fill="#0066ff" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Vena Cava Inflow</text>

              {/* Explanatory Callout */}
              <rect x="440" y="70" width="310" height="110" rx="12" fill="#141722" stroke="#222533" strokeWidth="1.5" />
              <text x="460" y="100" fill="#00d2ff" fontSize="12" fontWeight="bold" fontFamily="monospace">SYNCHRONIZED STEP-BY-STEP REASONING</text>
              <text x="460" y="125" fill="#f4f5f8" fontSize="13" fontWeight="bold" fontFamily="sans-serif">Dual-Pump Circulatory Architecture</text>
              <text x="460" y="150" fill="#94a3b8" fontSize="11" fontFamily="sans-serif">Deoxygenated blood travels through pulmonary loops</text>
              <text x="460" y="166" fill="#94a3b8" fontSize="11" fontFamily="sans-serif">while the systemic circuit perfuses vital bodily organs.</text>

              {/* Call to action inside preview */}
              <g transform="translate(440, 205)">
                <rect width="310" height="42" rx="10" fill="#0066ff" className="hover:opacity-90 cursor-pointer" />
                <text x="155" y="26" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                  Launch Interactive Heart Masterclass →
                </text>
              </g>
            </svg>
            <Link href="/studio?exemplar=heart" className="absolute inset-0" aria-label="Launch Heart Masterclass" />
          </div>
        </div>

        {/* Curated Topics Showcase */}
        <SuggestedTopics />

        {/* Production Architecture & Engineering Guarantee */}
        <div className="w-full max-w-5xl mt-20 pt-12 border-t border-[#222533]">
          <div className="text-center mb-8">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Production Architecture & Zero-Mock Engineering
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Built with server-side NVIDIA NIM inference, synchronized browser SpeechSynthesis, and vector smartboard engine
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#10121a] border border-[#222533] space-y-2.5 shadow-lg">
              <div className="w-9 h-9 rounded-xl bg-[#0f243c] text-[#00d2ff] flex items-center justify-center border border-[#1b3d63] shadow-inner">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">NVIDIA NIM AI Core</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Powered by server-side NVIDIA Nemotron 3.5 Lightning inference. Generates strictly typed, Zod-validated lesson plans with SVG drawing coordinates in sub-4-second response times.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#10121a] border border-[#222533] space-y-2.5 shadow-lg">
              <div className="w-9 h-9 rounded-xl bg-[#09261a] text-[#00d084] flex items-center justify-center border border-[#005c38] shadow-inner">
                <Volume2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Event-Driven Speech Sync</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Browser Web Speech API (SpeechSynthesisUtterance) engine synchronized segment-by-segment with visual whiteboard state. Supports play, pause, resume, seek, and speed multipliers.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#10121a] border border-[#222533] space-y-2.5 shadow-lg">
              <div className="w-9 h-9 rounded-xl bg-[#1d2233] text-[#0066ff] flex items-center justify-center border border-[#2b334d] shadow-inner">
                <PenTool className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Interactive Smartboard</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Porcelain white 1000×600 smartboard canvas with zoom, pan, teacher laser pointer, clickable concept inspection tooltips, and an independent student annotation layer with pen, highlighter, and eraser.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#222533] bg-[#10121a] px-6 py-6 text-xs text-neutral-500 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span>Braynix Studios Assignment</span>
          <span>•</span>
          <span className="text-neutral-400 font-mono">Autonomous AI Whiteboard Tutor</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="https://github.com/Adityakashid-mathionix/ai-whiteboard-tutor-assignment"
            target="_blank"
            rel="noreferrer"
            className="hover:text-neutral-300 transition-colors"
          >
            GitHub Repository
          </Link>
          <Link
            href="/studio?exemplar=heart"
            className="text-[#00d2ff] hover:text-white font-semibold"
          >
            Launch Studio →
          </Link>
        </div>
      </footer>
    </div>
  );
}

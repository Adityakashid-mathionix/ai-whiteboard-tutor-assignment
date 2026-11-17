import React from "react";
import Link from "next/link";
import { TopicChat } from "@/components/chat/TopicChat";
import { SuggestedTopics } from "@/components/chat/SuggestedTopics";
import { Mic2, PenLine, MessagesSquare } from "lucide-react";

const PILLARS = [
  {
    icon: Mic2,
    title: "It talks like a teacher",
    body: "Short spoken sentences, a real analogy for every abstract idea, and concrete numbers instead of filler. The narration is written to be heard, not read.",
  },
  {
    icon: PenLine,
    title: "It draws what it says",
    body: "The board reads the explanation and picks the right picture — a flow for a process, a ring for a cycle, two columns for a contrast, a dated axis for history — labelled with the lesson's own words.",
  },
  {
    icon: MessagesSquare,
    title: "It answers back",
    body: "Stop any time and ask. The tutor keeps the whole lesson in context and replies at the depth and in the language you picked.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground desk-grid flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-electric/10 font-mono text-xs font-bold text-electric ring-1 ring-electric/25">
              BX
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold tracking-tight">Braynix Studios</span>
              <span className="eyebrow">whiteboard tutor</span>
            </span>
          </div>

          <Link
            href="/studio?exemplar=heart"
            className="btn-interactive rounded-full border border-border bg-paper px-4 py-1.5 font-mono text-xs text-foreground shadow-paper"
          >
            open studio →
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 sm:px-8">
        {/* Hero */}
        <section className="py-12 sm:py-16">
          <div className="text-center">
            <p className="eyebrow">ai whiteboard tutor</p>
            <h1 className="display-hand mt-3 text-5xl leading-[0.95] sm:text-7xl">
              Learn it like someone
              <br />
              is teaching you.
            </h1>
            <p className="prose-paper mx-auto mt-5 max-w-xl text-[15px]">
              Tell the tutor what you want to understand. It plans the lesson, speaks it
              aloud, and draws the diagram that actually explains it.
            </p>
          </div>

          <div className="mt-8">
            <TopicChat />
          </div>
        </section>

        {/* Board preview */}
        <section className="section-rule relative py-14">
          <span className="tape-strip left-1/2 top-[52px] hidden -translate-x-1/2 -rotate-2 sm:block" />

          <div className="paper-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-2.5">
              <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-eyebrow text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-electric" />
                smartboard
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">1000 × 600 vector</span>
            </div>

            <div className="smartboard-porcelain p-4">
              <svg viewBox="0 0 1000 420" className="h-auto w-full" role="img" aria-label="Example whiteboard explaining how blood moves through the heart">
                <text x="500" y="44" textAnchor="middle" fontSize="30" fontWeight="bold" fill="#1b1b1b" fontFamily="Caveat, cursive">
                  How blood moves through the heart
                </text>
                <line x1="56" y1="62" x2="944" y2="62" stroke="#1677ff" strokeWidth="1.4" />

                <rect x="56" y="80" width="580" height="300" rx="14" fill="rgba(252,250,246,0.9)" stroke="#1677ff" strokeWidth="1.4" />
                <text x="76" y="106" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="bold" fill="#1677ff">
                  HOW IT WORKS, STEP BY STEP
                </text>

                {[
                  { x: 92, label: "Body → right atrium" },
                  { x: 356, label: "Right ventricle → lungs" },
                ].map((s, i) => (
                  <g key={i}>
                    <rect x={s.x} y="150" width="240" height="62" rx="9" fill="rgba(230,244,255,0.6)" stroke="#1677ff" strokeWidth="1.6" />
                    <text x={s.x + 120} y="186" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1b1b1b" fontFamily="Inter, sans-serif">
                      {s.label}
                    </text>
                  </g>
                ))}
                <line x1="338" y1="181" x2="350" y2="181" stroke="#1677ff" strokeWidth="1.8" />

                <rect x="92" y="262" width="240" height="62" rx="9" fill="rgba(230,244,255,0.6)" stroke="#1677ff" strokeWidth="1.6" />
                <text x="212" y="298" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1b1b1b" fontFamily="Inter, sans-serif">
                  Lungs → left atrium
                </text>
                <rect x="356" y="262" width="240" height="62" rx="9" fill="rgba(209,250,229,0.55)" stroke="#059669" strokeWidth="1.6" />
                <text x="476" y="298" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1b1b1b" fontFamily="Inter, sans-serif">
                  Left ventricle → body
                </text>

                <rect x="656" y="80" width="288" height="300" rx="12" fill="rgba(230,244,255,0.5)" stroke="#1677ff" strokeWidth="1.4" />
                <text x="673" y="106" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="bold" fill="#1677ff">
                  NOTES
                </text>
                <line x1="673" y1="116" x2="927" y2="116" stroke="#1677ff" strokeWidth="0.6" />
                {[
                  "1. The heart is two pumps side",
                  "   by side, not one.",
                  "2. The right side sends blood",
                  "   to the lungs for oxygen.",
                  "3. The left side pushes it out",
                  "   to the rest of the body.",
                ].map((line, i) => (
                  <text key={i} x="673" y={142 + i * 17} fontSize="12" fill="#2c2a27" fontFamily="Inter, sans-serif">
                    {line}
                  </text>
                ))}

                <rect x="56" y="396" width="888" height="18" rx="6" fill="rgba(255,239,177,0.55)" stroke="#d97706" strokeWidth="1.2" />
              </svg>
            </div>
          </div>

          <p className="mt-4 text-center font-mono text-[11px] text-muted-foreground">
            every topic gets the diagram that fits it — not the same two boxes
          </p>
        </section>

        <SuggestedTopics />

        {/* Pillars */}
        <section className="section-rule py-14">
          <p className="eyebrow">what makes it different</p>
          <h2 className="display-hand mt-2 text-5xl">Three things it gets right</h2>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {PILLARS.map(({ icon: Icon, title, body }) => (
              <article key={title} className="paper-card card-hover-smooth p-5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-electric/10 text-electric ring-1 ring-electric/20">
                  <Icon className="h-4 w-4" />
                </span>
                <h3 className="mt-3 text-sm font-semibold">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="section-rule bg-paper/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-5 py-6 font-mono text-[11px] text-muted-foreground sm:flex-row sm:px-8">
          <span>Braynix Studios · AI Interactive Whiteboard Tutor</span>
          <span>NVIDIA NIM · Web Speech API · SVG board engine</span>
        </div>
      </footer>
    </div>
  );
}

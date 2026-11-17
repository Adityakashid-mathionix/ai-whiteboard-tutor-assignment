"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Heart, Leaf, Compass, Layers, Globe, Sparkles, ArrowUpRight, Play } from "lucide-react";

export const SUGGESTED_TOPICS = [
  {
    title: "How the Human Heart Works",
    category: "Cardiovascular Biology",
    description: "Dual-action biological pump, atria and ventricles, pulmonary and systemic circulation.",
    icon: Heart,
    color: "bg-[#2b0d14] text-[#ff3355] border-[#521926]",
    slug: "How the Human Heart Works",
    exemplarKey: "heart",
    badge: "Most Popular",
  },
  {
    title: "Photosynthesis",
    category: "Biochemistry",
    description: "Chloroplast machinery, photon absorption, water/CO2 inputs, glucose and oxygen outputs.",
    icon: Leaf,
    color: "bg-[#002e1c] text-[#00d084] border-[#005c38]",
    slug: "Photosynthesis",
    exemplarKey: "photosynthesis",
    badge: "Bio Essentials",
  },
  {
    title: "Newton's Third Law",
    category: "Classical Physics",
    description: "Equal and opposite force pairs, momentum conservation, and rocket propulsion vectors.",
    icon: Compass,
    color: "bg-[#2b1c00] text-[#ffaa00] border-[#573900]",
    slug: "Newton's Third Law",
    exemplarKey: "newton",
    badge: "Core Physics",
  },
  {
    title: "How an API Works",
    category: "Software Systems",
    description: "Client-server architecture, HTTP request-response lifecycle, JSON serialization, and databases.",
    icon: Globe,
    color: "bg-[#0f243c] text-electric border-electric/30",
    slug: "How an API Works",
    exemplarKey: "api",
    badge: "CS Architecture",
  },
  {
    title: "React Native Architecture",
    category: "Mobile Systems",
    description: "JavaScript Hermes engine, JSI (JavaScript Interface), Fabric renderer, and C++ TurboModules.",
    icon: Layers,
    color: "bg-[#082347] text-[#00d2ff] border-[#133b70]",
    slug: "React Native Architecture",
    exemplarKey: "react_native",
    badge: "Mobile Deep Dive",
  },
];

interface SuggestedTopicsProps {
  onSelect?: (topic: string) => void;
}

export const SuggestedTopics: React.FC<SuggestedTopicsProps> = ({ onSelect }) => {
  const router = useRouter();

  const handleCardClick = (item: typeof SUGGESTED_TOPICS[0]) => {
    if (onSelect) {
      onSelect(item.slug);
    } else {
      router.push(`/studio?exemplar=${item.exemplarKey}`);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-12">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center space-x-2 text-xs font-mono font-bold tracking-wider text-neutral-300 uppercase">
          <Sparkles className="w-3.5 h-3.5 text-electric" />
          <span>Curated Masterclass Exemplars</span>
        </div>
        <span className="text-[11px] font-mono text-neutral-500">~2 min synchronized whiteboard lessons</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SUGGESTED_TOPICS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              onClick={() => handleCardClick(item)}
              className="group text-left p-5 rounded-2xl bg-[#141720] hover:bg-[#181c28] border border-[#282d3b] hover:border-electric/50 transition-all duration-200 flex flex-col justify-between space-y-3 hover:shadow-lg hover:shadow-electric/5 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl border ${item.color} transition-transform group-hover:scale-105`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 px-2 py-0.5 rounded-full bg-[#1e2230] border border-[#282d3b]">
                    {item.badge}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-[#1e2230] text-neutral-400 group-hover:text-electric flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-electric block mb-1">
                  {item.category}
                </span>
                <h3 className="text-base font-serif font-bold text-[#f6f4ef] group-hover:text-electric transition-colors leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed font-sans">
                  {item.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[#282d3b]/60 flex items-center justify-between text-[11px] font-mono text-neutral-500 group-hover:text-neutral-300">
                <div className="flex items-center space-x-1.5">
                  <Play className="w-3 h-3 text-electric" />
                  <span>Start Lesson</span>
                </div>
                <span className="text-neutral-500 font-sans text-xs">Vector & Voice</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

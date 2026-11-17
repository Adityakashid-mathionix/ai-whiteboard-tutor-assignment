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
    color: "bg-rose-50 text-rose-600 border-rose-200",
    slug: "How the Human Heart Works",
    exemplarKey: "heart",
    badge: "Most Popular",
  },
  {
    title: "Photosynthesis",
    category: "Biochemistry",
    description: "Chloroplast machinery, photon absorption, water/CO2 inputs, glucose and oxygen outputs.",
    icon: Leaf,
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    slug: "Photosynthesis",
    exemplarKey: "photosynthesis",
    badge: "Bio Essentials",
  },
  {
    title: "Newton's Third Law",
    category: "Classical Physics",
    description: "Equal and opposite force pairs, momentum conservation, and rocket propulsion vectors.",
    icon: Compass,
    color: "bg-amber-50 text-amber-600 border-amber-200",
    slug: "Newton's Third Law",
    exemplarKey: "newton",
    badge: "Core Physics",
  },
  {
    title: "How an API Works",
    category: "Software Systems",
    description: "Client-server architecture, HTTP request-response lifecycle, JSON serialization, and databases.",
    icon: Globe,
    color: "bg-sky-50 text-sky-600 border-sky-200",
    slug: "How an API Works",
    exemplarKey: "api",
    badge: "CS Architecture",
  },
  {
    title: "React Native Architecture",
    category: "Mobile Systems",
    description: "JavaScript Hermes engine, JSI (JavaScript Interface), Fabric renderer, and C++ TurboModules.",
    icon: Layers,
    color: "bg-blue-50 text-blue-600 border-blue-200",
    slug: "React Native Architecture",
    exemplarKey: "react_native",
    badge: "Mobile Deep Dive",
  },
  {
    title: "The Evolution of Laptops",
    category: "Hardware & Computing",
    description: "From 25-pound luggables to clamshells, TFT displays, TrackPoints, and modern ARM silicon.",
    icon: Sparkles,
    color: "bg-indigo-50 text-indigo-600 border-indigo-200",
    slug: "The Evolution of Laptops",
    exemplarKey: "laptop",
    badge: "Hardware History",
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
        <div className="flex items-center space-x-2 text-xs font-mono font-bold tracking-wider text-neutral-700 uppercase">
          <Sparkles className="w-3.5 h-3.5 text-electric animate-spin [animation-duration:8s]" />
          <span>Curated Masterclass Exemplars</span>
        </div>
        <span className="text-[11px] font-mono text-neutral-400">~2 min synchronized whiteboard lessons</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SUGGESTED_TOPICS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              onClick={() => handleCardClick(item)}
              className="group text-left p-5 rounded-2xl bg-white hover:bg-[#fafbfc] border border-[#e2e5eb] hover:border-electric transition-all duration-300 flex flex-col justify-between space-y-3 shadow-sm hover:shadow-xl hover:-translate-y-1 relative overflow-hidden active:scale-[0.99]"
            >
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl border ${item.color} transition-transform duration-300 group-hover:scale-110 shadow-xs`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200">
                    {item.badge}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-400 group-hover:text-electric group-hover:bg-electric/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-electric font-semibold block mb-1">
                  {item.category}
                </span>
                <h3 className="text-base font-serif font-bold text-[#0d0e11] group-hover:text-electric transition-colors leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed font-sans">
                  {item.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[#f1f3f7] flex items-center justify-between text-[11px] font-mono text-neutral-400 group-hover:text-neutral-700">
                <div className="flex items-center space-x-1.5">
                  <Play className="w-3 h-3 text-electric fill-electric/30" />
                  <span className="font-semibold text-neutral-700">Start Lesson</span>
                </div>
                <span className="text-neutral-400 font-sans text-xs">Vector & Voice</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

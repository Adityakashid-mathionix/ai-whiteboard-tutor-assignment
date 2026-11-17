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
  },
  {
    title: "Photosynthesis",
    category: "Biochemistry",
    description: "Chloroplast machinery, photon absorption, water/CO2 inputs, glucose and oxygen outputs.",
    icon: Leaf,
    color: "bg-[#002e1c] text-[#00d084] border-[#005c38]",
    slug: "Photosynthesis",
    exemplarKey: "photosynthesis",
  },
  {
    title: "Newton's Third Law",
    category: "Classical Physics",
    description: "Equal and opposite force pairs, momentum conservation, and rocket propulsion vectors.",
    icon: Compass,
    color: "bg-[#2b1c00] text-[#ffaa00] border-[#573900]",
    slug: "Newton's Third Law",
    exemplarKey: "newton",
  },
  {
    title: "How an API Works",
    category: "Software Systems",
    description: "Client-server architecture, HTTP request-response lifecycle, JSON serialization, and databases.",
    icon: Globe,
    color: "bg-[#0f243c] text-[#00d2ff] border-[#1b3d63]",
    slug: "How an API Works",
    exemplarKey: "api",
  },
  {
    title: "React Native Architecture",
    category: "Mobile Systems",
    description: "JavaScript Hermes engine, JSI (JavaScript Interface), Fabric renderer, and C++ TurboModules.",
    icon: Layers,
    color: "bg-[#082347] text-[#00a8e8] border-[#133b70]",
    slug: "React Native Architecture",
    exemplarKey: "react_native",
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
        <div className="flex items-center space-x-2 text-xs font-bold tracking-wider text-neutral-300 uppercase font-mono">
          <Sparkles className="w-3.5 h-3.5 text-[#00d2ff]" />
          <span>Curated Educational Masterclasses</span>
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
              className="group text-left p-4.5 rounded-2xl bg-[#10121a] hover:bg-[#141722] border border-[#222533] hover:border-[#2f3447] transition-all duration-200 flex flex-col justify-between space-y-3 hover:shadow-xl hover:shadow-[#0066ff]/5 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border ${item.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-mono font-medium text-neutral-400 bg-[#141722] px-2 py-0.5 rounded-full border border-[#222533]">
                    {item.category}
                  </span>
                  <div className="p-1 rounded-full text-neutral-500 group-hover:text-[#00d2ff] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-neutral-100 group-hover:text-white transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center space-x-1 text-[11px] font-mono text-[#00d2ff] font-semibold pt-1">
                <Play className="w-3 h-3 fill-current" />
                <span>Launch Interactive Demo</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Heart, Leaf, Compass, Layers, Globe, Sparkles } from "lucide-react";

export const SUGGESTED_TOPICS = [
  {
    title: "How the Human Heart Works",
    category: "Biology & Medicine",
    description: "Dual-action biological pump, atria and ventricles, pulmonary and systemic circulation.",
    icon: Heart,
    color: "from-rose-500/20 to-red-500/10 text-rose-400 border-rose-500/30",
    slug: "How the Human Heart Works",
  },
  {
    title: "Photosynthesis",
    category: "Plant Biology & Chemistry",
    description: "Chloroplast machinery, solar light capture, water/CO2 inputs, glucose and oxygen outputs.",
    icon: Leaf,
    color: "from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30",
    slug: "Photosynthesis",
  },
  {
    title: "Newton's Third Law",
    category: "Classical Physics",
    description: "Action and equal opposite reaction pairs, momentum conservation, and rocket propulsion.",
    icon: Compass,
    color: "from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30",
    slug: "Newton's Third Law",
  },
  {
    title: "How an API Works",
    category: "Software Engineering",
    description: "Client-server architecture, HTTP request-response lifecycle, endpoints, headers, and JSON.",
    icon: Globe,
    color: "from-sky-500/20 to-blue-500/10 text-sky-400 border-sky-500/30",
    slug: "How an API Works",
  },
  {
    title: "React Native Architecture",
    category: "Mobile Systems",
    description: "JavaScript thread, Shadow thread, Yoga layout engine, Fabric renderer, and JSI bridge.",
    icon: Layers,
    color: "from-indigo-500/20 to-violet-500/10 text-indigo-400 border-indigo-500/30",
    slug: "React Native Architecture",
  },
];

interface SuggestedTopicsProps {
  onSelect?: (topic: string) => void;
}

export const SuggestedTopics: React.FC<SuggestedTopicsProps> = ({ onSelect }) => {
  const router = useRouter();

  const handleCardClick = (topicSlug: string) => {
    if (onSelect) {
      onSelect(topicSlug);
    } else {
      router.push(`/studio?topic=${encodeURIComponent(topicSlug)}`);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-10">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center space-x-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>Curated Educational Masterclasses</span>
        </div>
        <span className="text-[11px] text-slate-500">~2 min synchronized whiteboard lessons</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {SUGGESTED_TOPICS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              onClick={() => handleCardClick(item.slug)}
              className="group text-left p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all duration-200 flex flex-col justify-between space-y-3 hover:shadow-xl hover:shadow-sky-500/5 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br border ${item.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-950/80 px-2 py-0.5 rounded-full border border-slate-800">
                  {item.category}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-500">
                <span>Interactive SVG Demo</span>
                <span className="text-sky-400 font-medium group-hover:translate-x-0.5 transition-transform">
                  Launch Lesson →
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

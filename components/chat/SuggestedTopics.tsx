"use client";

import React from "react";
import Link from "next/link";

interface TopicCard {
  slug: string;
  title: string;
  blurb: string;
  tilt: string;
  color: string;
}

/**
 * Pre-rendered exemplar lessons. Each links by its explicit `exemplar` slug, so
 * a typed topic is never silently swapped for one of these.
 */
const TOPICS: TopicCard[] = [
  {
    slug: "heart",
    title: "How the heart works",
    blurb: "Two pumps, one loop — followed beat by beat.",
    tilt: "-rotate-2",
    color: "bg-sticky-pink",
  },
  {
    slug: "photosynthesis",
    title: "Photosynthesis",
    blurb: "Light in, sugar out, with the chemistry drawn.",
    tilt: "rotate-1",
    color: "bg-sticky-mint",
  },
  {
    slug: "api",
    title: "How an API works",
    blurb: "A request's full round trip, stage by stage.",
    tilt: "-rotate-1",
    color: "bg-sticky-blue",
  },
  {
    slug: "newton",
    title: "Newton's laws",
    blurb: "Three laws, three everyday situations.",
    tilt: "rotate-2",
    color: "bg-sticky-yellow",
  },
  {
    slug: "react_native",
    title: "React Native architecture",
    blurb: "JS engine, bridge and native host, laid out.",
    tilt: "-rotate-1",
    color: "bg-sticky-beige",
  },
  {
    slug: "laptop",
    title: "Evolution of the laptop",
    blurb: "From a 24-pound luggable to a 2-pound slab.",
    tilt: "rotate-1",
    color: "bg-sticky-blue",
  },
];

export const SuggestedTopics: React.FC = () => {
  return (
    <section className="section-rule py-14">
      <p className="eyebrow">ready to play</p>
      <h2 className="display-hand mt-2 text-5xl">Pre-built masterclasses</h2>
      <p className="prose-paper mt-3 max-w-xl text-[15px]">
        Hand-checked lessons that run instantly, with no API key. Useful for seeing what a
        finished board looks like before you type your own topic.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOPICS.map((topic) => (
          <Link
            key={topic.slug}
            href={`/studio?exemplar=${topic.slug}`}
            className={`sticky-note block rounded-lg p-4 ${topic.color} ${topic.tilt} transition-transform`}
          >
            <span className="eyebrow text-foreground/50">lesson</span>
            <h3 className="handwritten mt-1 text-2xl leading-tight text-foreground">
              {topic.title}
            </h3>
            <p className="mt-1.5 text-[13px] leading-snug text-foreground/70">{topic.blurb}</p>
            <span className="mt-3 block font-mono text-[11px] text-foreground/60">play →</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

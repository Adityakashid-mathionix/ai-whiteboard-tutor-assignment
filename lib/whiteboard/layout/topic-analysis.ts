/**
 * Content analysis for the whiteboard layout engine.
 *
 * The old engine drew the same "Component A / Component B" boxes for every
 * topic, which is why arbitrary subjects looked generic. This module reads the
 * narration a teacher is about to speak and extracts what is actually being
 * taught — steps, contrasted pairs, named parts, dated milestones, measured
 * quantities — then picks the diagram archetype that fits.
 *
 * Everything here is deterministic and dependency-free so it can be unit
 * tested and so a lesson renders identically on server and client.
 */

export type DiagramArchetype =
  | "process"
  | "cycle"
  | "comparison"
  | "parts"
  | "timeline"
  | "quantity"
  | "concept";

export interface TimelineEvent {
  label: string;
  when: string;
}

export interface QuantityValue {
  label: string;
  value: number;
  unit: string;
}

export interface ComparisonPair {
  leftTitle: string;
  rightTitle: string;
  leftPoints: string[];
  rightPoints: string[];
}

export interface SegmentAnalysis {
  archetype: DiagramArchetype;
  /** Short subject of the chapter, used as the centre of a diagram. */
  subject: string;
  /** Ordered stages for process/cycle diagrams. */
  steps: string[];
  /** Named parts for a decomposition diagram. */
  parts: string[];
  /** Two contrasted sides, when the chapter compares things. */
  comparison: ComparisonPair | null;
  /** Dated milestones, most relevant first. */
  events: TimelineEvent[];
  /** Measured values with units. */
  quantities: QuantityValue[];
  /** Salient terms worth labelling on the board. */
  keyTerms: string[];
}

const STOPWORDS = new Set([
  "the","a","an","and","or","but","of","to","in","on","at","for","with","from","by","as",
  "is","are","was","were","be","been","being","it","its","this","that","these","those",
  "we","you","they","he","she","i","our","your","their","his","her","them","us","me",
  "can","will","would","could","should","may","might","must","shall","do","does","did",
  "have","has","had","not","no","yes","if","then","than","when","while","because","so",
  "very","more","most","much","many","some","any","each","every","also","just","only",
  "into","through","about","after","before","between","during","over","under","again",
  "here","there","what","which","who","whom","how","why","where","all","both","few",
  "chapter","lesson","today","let","lets","now","next","first","second","third","finally",
  "understand","understanding","look","looks","see","start","begin","begins","explore",
]);

const SEQUENCE_MARKERS = [
  "first","firstly","second","secondly","third","thirdly","then","next","after that",
  "finally","lastly","subsequently","once","begins","starts with","followed by","step",
  "stage","phase","produces","leads to","results in","passes to","sends","travels to",
];

const CYCLE_MARKERS = [
  "cycle","loop","repeat","repeats","repeating","feedback","returns to","back to the start",
  "continuous","circulates","circulation","recycle","iteration","orbit",
];

const COMPARISON_MARKERS = [
  " vs ", " vs. ", "versus", "compared to", "compared with", "difference between",
  "differs from", "unlike", "whereas", "on the other hand", "in contrast", "rather than",
  "before and after", "trade-off", "tradeoff",
];

const PARTS_MARKERS = [
  "consists of","made up of","composed of","comprises","components","parts","elements",
  "types of","kinds of","categories","divided into","layers","modules","sections",
  "built from","contains","includes",
];

function lower(text: string): string {
  return text.toLowerCase();
}

function countMatches(haystack: string, needles: string[]): number {
  return needles.reduce((total, needle) => (haystack.includes(needle) ? total + 1 : total), 0);
}

/** Sentences, trimmed, with trailing punctuation removed. */
export function sentencesOf(text: string): string[] {
  return text
    .replace(/([.?!])\s+/g, "$1|")
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function titleCase(term: string): string {
  return term.charAt(0).toUpperCase() + term.slice(1);
}

/** Strips leading connectives so a fragment reads as a label. */
function cleanFragment(fragment: string): string {
  return fragment
    .replace(/^(and|or|then|next|after that|finally|which|that|it|this|these|the|a|an)\s+/i, "")
    .replace(/[.,;:]+$/, "")
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .trim();
}

/** Shortens a fragment to a board-sized label of at most `maxWords` words. */
function toLabel(fragment: string, maxWords = 4): string {
  const cleaned = cleanFragment(fragment);
  if (!cleaned) return "";

  const words = cleaned.split(/\s+/).filter(Boolean);
  const head = words.slice(0, maxWords).join(" ");
  return titleCase(head);
}

/**
 * Extracts "A, B and C" style enumerations, which carry most of the named
 * entities in explanatory prose.
 */
export function extractListItems(text: string): string[] {
  const items: string[] = [];
  const listRegex = /(?:such as|including|consists of|composed of|made up of|comprises|divided into|types of|kinds of|namely)\s+([^.;!?]+)/gi;

  let match: RegExpExecArray | null;
  while ((match = listRegex.exec(text)) !== null) {
    const run = match[1];
    run
      .split(/,|\band\b|\bor\b/gi)
      .map((piece) => toLabel(piece, 3))
      .filter((piece) => piece.length > 1)
      .forEach((piece) => items.push(piece));
  }

  return dedupe(items);
}

/** Ordered stages, read from explicit sequence markers or clause order. */
export function extractSteps(text: string): string[] {
  const steps: string[] = [];

  const markerRegex = /\b(?:first(?:ly)?|then|next|after that|subsequently|finally|lastly)\b[,:]?\s+([^.;!?]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = markerRegex.exec(text)) !== null) {
    const label = toLabel(match[1], 4);
    if (label.length > 2) steps.push(label);
  }

  if (steps.length < 2) {
    // Fall back to causal chains: "X produces Y, which leads to Z".
    const chainRegex = /\b(?:produces|leads to|results in|passes to|sends|travels to|converts(?: it)? into|turns into|becomes)\s+([^.;!?,]+)/gi;
    while ((match = chainRegex.exec(text)) !== null) {
      const label = toLabel(match[1], 3);
      if (label.length > 2) steps.push(label);
    }
  }

  return dedupe(steps).slice(0, 5);
}

/** Dated milestones such as "In 1981, the Osborne 1 shipped". */
export function extractEvents(text: string): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  const yearRegex = /\b(1[5-9]\d{2}|20\d{2})s?\b/g;
  const sentences = sentencesOf(text);

  for (const sentence of sentences) {
    const years = sentence.match(yearRegex);
    if (!years) continue;

    const when = years[0];
    const label = toLabel(
      sentence
        .replace(/\b(?:in|by|during|around|circa)\b\s*/gi, " ")
        .replace(yearRegex, " ")
        .replace(/\s+/g, " "),
      4
    );

    if (label) events.push({ when, label });
  }

  // Decade phrasing: "the early 1980s", "the 90s"
  return dedupe(events.map((e) => `${e.when}|${e.label}`))
    .map((joined) => {
      const [when, label] = joined.split("|");
      return { when, label };
    })
    .slice(0, 5);
}

/** Measured values: "24.5 lbs", "70%", "3 billion cells". */
export function extractQuantities(text: string): QuantityValue[] {
  const values: QuantityValue[] = [];
  const quantityRegex =
    /(\d+(?:[.,]\d+)?)\s*(%|percent|kg|g|lbs?|pounds?|km|m\b|cm|mm|ms|seconds?|minutes?|hours?|days?|years?|bytes?|kb|mb|gb|tb|hz|khz|mhz|ghz|volts?|watts?|degrees?|°c|°f|bpm|litres?|liters?|ml)/gi;

  let match: RegExpExecArray | null;
  while ((match = quantityRegex.exec(text)) !== null) {
    const value = Number(match[1].replace(",", "."));
    if (!Number.isFinite(value)) continue;

    // Name the measurement from the words just before the number.
    const before = text.slice(Math.max(0, match.index - 60), match.index);
    const label = toLabel(before.split(/[,.;:]/).pop() || "", 3) || "Value";

    values.push({ label, value, unit: match[2].toLowerCase() });
  }

  return values.slice(0, 5);
}

/** Two contrasted sides, when the narration sets something against something. */
export function extractComparison(text: string, subject: string): ComparisonPair | null {
  const haystack = lower(text);
  if (countMatches(haystack, COMPARISON_MARKERS) === 0) return null;

  const explicit = text.match(
    /\b([\w\s-]{3,28}?)\s+(?:vs\.?|versus|compared to|compared with|rather than|unlike)\s+([\w\s-]{3,28})/i
  );

  const leftTitle = explicit ? toLabel(explicit[1], 3) : "Before";
  const rightTitle = explicit ? toLabel(explicit[2], 3) : "After";

  const sentences = sentencesOf(text);
  const leftPoints: string[] = [];
  const rightPoints: string[] = [];

  for (const sentence of sentences) {
    const s = lower(sentence);
    const label = toLabel(sentence, 6);
    if (!label) continue;

    if (s.includes("whereas") || s.includes("in contrast") || s.includes("on the other hand")) {
      rightPoints.push(label);
    } else if (leftPoints.length < 2) {
      leftPoints.push(label);
    }
  }

  return {
    leftTitle: leftTitle || "Before",
    rightTitle: rightTitle || "After",
    leftPoints: leftPoints.slice(0, 2),
    rightPoints: rightPoints.slice(0, 2),
  };
}

/** Salient multi-word terms and capitalised entities. */
export function extractKeyTerms(text: string, limit = 6): string[] {
  const terms: string[] = [];

  // Terms the narration explicitly names.
  const namedRegex = /\b(?:called|known as|termed|named)\s+(?:the\s+)?([A-Za-z][\w-]*(?:\s+[A-Za-z][\w-]*){0,2})/gi;
  let match: RegExpExecArray | null;
  while ((match = namedRegex.exec(text)) !== null) {
    terms.push(titleCase(match[1].trim()));
  }

  // Capitalised phrases that are not sentence openers.
  const capitalRegex = /(?<=[a-z,]\s)([A-Z][\w-]+(?:\s+[A-Z][\w-]+){0,2})/g;
  while ((match = capitalRegex.exec(text)) !== null) {
    terms.push(match[1].trim());
  }

  // Frequent domain nouns as a last resort.
  if (terms.length < limit) {
    const counts = new Map<string, number>();
    for (const word of text.toLowerCase().match(/\b[a-z][a-z-]{4,}\b/g) || []) {
      if (STOPWORDS.has(word)) continue;
      counts.set(word, (counts.get(word) || 0) + 1);
    }

    [...counts.entries()]
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .forEach(([word]) => terms.push(titleCase(word)));
  }

  return dedupe(terms).slice(0, limit);
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const item of items) {
    const key = item.toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item.trim());
  }

  return out;
}

/** Trims a chapter heading down to the thing being taught. */
export function subjectOf(heading: string, topic: string): string {
  const cleaned = heading
    .replace(/^chapter\s*\d+\s*[:.-]?\s*/i, "")
    .replace(/^(the|an|a)\s+/i, "")
    .replace(/\b(foundations?|introduction|overview|basics?|fundamentals?)\s+of\s+/i, "")
    .trim();

  return cleaned || topic;
}

/**
 * Reads a chapter and decides what kind of diagram genuinely represents it.
 *
 * Scores every archetype against signals in the text and picks the strongest;
 * "concept" is the floor, so a chapter with no structural signal still gets a
 * meaningful definition-and-terms board rather than fake process boxes.
 */
export function analyzeSegment(input: {
  heading: string;
  narration: string;
  keyTakeaway?: string;
  topic?: string;
}): SegmentAnalysis {
  const { heading, narration, keyTakeaway = "", topic = "" } = input;
  const text = `${heading}. ${narration} ${keyTakeaway}`.trim();
  const haystack = lower(text);

  const subject = subjectOf(heading, topic || heading);

  const steps = extractSteps(text);
  const listItems = extractListItems(text);
  const events = extractEvents(text);
  const quantities = extractQuantities(text);
  const comparison = extractComparison(text, subject);
  const keyTerms = extractKeyTerms(text);

  const scores: Record<DiagramArchetype, number> = {
    // A cycle is a process that closes the loop, so it must outscore "process"
    // whenever the narration actually says the sequence repeats.
    cycle:
      countMatches(haystack, CYCLE_MARKERS) > 0
        ? countMatches(haystack, CYCLE_MARKERS) * 3 + steps.length * 1.5 + 1
        : 0,
    process: countMatches(haystack, SEQUENCE_MARKERS) + steps.length * 1.5,
    comparison: comparison ? countMatches(haystack, COMPARISON_MARKERS) * 2 + 1 : 0,
    parts: countMatches(haystack, PARTS_MARKERS) * 1.5 + (listItems.length >= 2 ? 2 : 0),
    timeline: events.length >= 2 ? events.length * 1.5 : 0,
    quantity: quantities.length >= 3 ? quantities.length : 0,
    concept: 0.9, // floor, so a weak signal never wins by default
  };

  let archetype: DiagramArchetype = "concept";
  let best = scores.concept;
  for (const key of Object.keys(scores) as DiagramArchetype[]) {
    if (scores[key] > best) {
      best = scores[key];
      archetype = key;
    }
  }

  // A diagram needs enough material to be worth drawing; demote if it is thin.
  if ((archetype === "process" || archetype === "cycle") && steps.length < 2) {
    archetype = listItems.length >= 2 ? "parts" : "concept";
  }
  if (archetype === "parts" && listItems.length < 2 && keyTerms.length < 2) {
    archetype = "concept";
  }

  return {
    archetype,
    subject,
    steps,
    parts: listItems.length >= 2 ? listItems : keyTerms.slice(0, 4),
    comparison,
    events,
    quantities,
    keyTerms,
  };
}

/**
 * Builds an analysis from the model's own diagram brief, falling back to the
 * text-derived analysis for anything the brief leaves out.
 *
 * The model knows the subject far better than a regex does, so when it says
 * "this chapter is a cycle with these four stages", that wins.
 */
export function analysisFromHint(
  hint: {
    kind?: string;
    items?: string[];
    left?: { title: string; points: string[] };
    right?: { title: string; points: string[] };
    events?: { when: string; label: string }[];
    values?: { label: string; value: number; unit: string }[];
  },
  derived: SegmentAnalysis
): SegmentAnalysis {
  const items = (hint.items || []).map((i) => i.trim()).filter(Boolean);
  const events = hint.events?.filter((e) => e.when && e.label) || [];
  const values = hint.values?.filter((v) => Number.isFinite(v.value)) || [];

  const comparison =
    hint.left && hint.right
      ? {
          leftTitle: hint.left.title,
          rightTitle: hint.right.title,
          leftPoints: hint.left.points?.slice(0, 3) || [],
          rightPoints: hint.right.points?.slice(0, 3) || [],
        }
      : derived.comparison;

  const requested = hint.kind as DiagramArchetype | undefined;

  // Only honour the requested shape when the brief carries the material for it.
  const canDraw: Record<DiagramArchetype, boolean> = {
    process: items.length >= 2,
    cycle: items.length >= 2,
    comparison: Boolean(comparison),
    parts: items.length >= 2,
    timeline: events.length >= 2,
    quantity: values.length >= 2,
    concept: true,
  };

  const archetype: DiagramArchetype =
    requested && canDraw[requested] ? requested : derived.archetype;

  return {
    archetype,
    subject: derived.subject,
    steps: items.length >= 2 ? items : derived.steps,
    parts: items.length >= 2 ? items : derived.parts,
    comparison,
    events: events.length > 0 ? events : derived.events,
    quantities: values.length > 0 ? values : derived.quantities,
    keyTerms: items.length > 0 ? items.slice(0, 4) : derived.keyTerms,
  };
}

/**
 * Speaking styles for the tutor.
 *
 * The browser gives us a fixed set of voices, but rate and pitch are ours to
 * shape — and they change how a voice reads far more than the voice list
 * suggests. These presets cover the ways a teacher actually varies delivery:
 * unhurried for dense material, brisk for revision, lower and slower for
 * something being spelled out.
 */

export type VoiceStyleId = "natural" | "calm" | "bright" | "deep" | "brisk";

export interface VoiceStyle {
  id: VoiceStyleId;
  label: string;
  desc: string;
  /** Multiplier applied on top of the player's playback speed. */
  rate: number;
  pitch: number;
}

export const VOICE_STYLES: readonly VoiceStyle[] = [
  {
    id: "natural",
    label: "Natural",
    desc: "How the voice sounds untouched.",
    rate: 0.95,
    pitch: 1.03,
  },
  {
    id: "calm",
    label: "Calm",
    desc: "Slower and level, for dense explanations.",
    rate: 0.84,
    pitch: 0.98,
  },
  {
    id: "bright",
    label: "Bright",
    desc: "Lighter and more animated.",
    rate: 1.0,
    pitch: 1.18,
  },
  {
    id: "deep",
    label: "Deep",
    desc: "Lower and deliberate.",
    rate: 0.88,
    pitch: 0.82,
  },
  {
    id: "brisk",
    label: "Brisk",
    desc: "Quicker, for revisiting a lesson.",
    rate: 1.14,
    pitch: 1.05,
  },
];

export const DEFAULT_VOICE_STYLE: VoiceStyleId = "natural";

export function getVoiceStyle(id: string | null | undefined): VoiceStyle {
  return VOICE_STYLES.find((style) => style.id === id) || VOICE_STYLES[0];
}

/** Accent groups, so a long voice list stays navigable. */
const ACCENT_LABELS: { test: RegExp; label: string }[] = [
  { test: /^en[-_]us/i, label: "American English" },
  { test: /^en[-_]gb/i, label: "British English" },
  { test: /^en[-_]in/i, label: "Indian English" },
  { test: /^en[-_]au/i, label: "Australian English" },
  { test: /^en[-_]ie/i, label: "Irish English" },
  { test: /^en[-_]za/i, label: "South African English" },
  { test: /^en[-_]ca/i, label: "Canadian English" },
  { test: /^en/i, label: "Other English" },
];

export function accentLabel(lang: string): string {
  return ACCENT_LABELS.find((entry) => entry.test.test(lang))?.label || "Other voices";
}

/** True for the neural / natural voices that sound closest to a person. */
export function isHighQualityVoiceName(name: string): boolean {
  return /natural|neural|wavenet|enhanced|premium/i.test(name);
}

/** Groups voices by accent, highest-quality first inside each group. */
export function groupVoices<T extends { name: string; lang: string }>(
  voices: T[]
): { label: string; voices: T[] }[] {
  const groups = new Map<string, T[]>();

  for (const voice of voices) {
    const label = accentLabel(voice.lang);
    const bucket = groups.get(label);
    if (bucket) bucket.push(voice);
    else groups.set(label, [voice]);
  }

  return [...groups.entries()]
    .map(([label, list]) => ({
      label,
      voices: [...list].sort((a, b) => {
        const quality = Number(isHighQualityVoiceName(b.name)) - Number(isHighQualityVoiceName(a.name));
        return quality !== 0 ? quality : a.name.localeCompare(b.name);
      }),
    }))
    .sort((a, b) => {
      // Keep the group order stable and sensible rather than insertion-ordered.
      const order = ACCENT_LABELS.map((e) => e.label).concat("Other voices");
      return order.indexOf(a.label) - order.indexOf(b.label);
    });
}

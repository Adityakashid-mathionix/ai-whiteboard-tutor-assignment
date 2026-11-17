/** Per-chapter accent palettes so consecutive segments look visually distinct. */
export interface LayoutPalette {
  accent: string;
  bg: string;
  light: string;
}

export const LAYOUT_PALETTES: readonly LayoutPalette[] = [
  { accent: "#1677ff", bg: "rgba(238, 242, 255, 0.6)", light: "rgba(224, 242, 254, 0.5)" },
  { accent: "#059669", bg: "rgba(236, 253, 245, 0.6)", light: "rgba(209, 250, 229, 0.5)" },
  { accent: "#7c3aed", bg: "rgba(243, 232, 255, 0.6)", light: "rgba(237, 233, 254, 0.5)" },
  { accent: "#0284c7", bg: "rgba(224, 242, 254, 0.6)", light: "rgba(207, 250, 254, 0.5)" },
  { accent: "#d97706", bg: "rgba(254, 243, 199, 0.6)", light: "rgba(254, 249, 195, 0.5)" },
];

export function paletteForIndex(index: number): LayoutPalette {
  return LAYOUT_PALETTES[index % LAYOUT_PALETTES.length];
}

/**
 * Canvas geometry shared by the layout builders.
 *
 * The diagram panel takes roughly two thirds of the board, the way a teacher
 * uses most of the surface for the drawing and keeps a narrow column of notes
 * at the side.
 */
export const CANVAS = {
  width: 1000,
  height: 600,
  centerX: 500,
  header: { baseline: 46, ruleY: 68 },
  visual: { x: 56, y: 86, width: 580, height: 420 },
  notes: { x: 656, y: 86, width: 288, height: 420 },
  footer: { y: 524, height: 52 },
} as const;

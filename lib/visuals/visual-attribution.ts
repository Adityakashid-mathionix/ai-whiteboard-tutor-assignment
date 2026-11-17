export interface VisualAttribution {
  title: string;
  sourceUrl: string;
  author: string;
  license: string;
  licenseUrl?: string;
}

export interface EducationalVisualAsset {
  id: string;
  title: string;
  url: string;
  thumbUrl?: string;
  mimeType: string;
  width: number;
  height: number;
  attribution: VisualAttribution;
  description?: string;
  /**
   * True only for hand-verified assets. Live Wikimedia search results are
   * frequently off-topic for arbitrary subjects, so only curated images are
   * allowed onto the board; everything else is taught with a drawn diagram.
   */
  curated?: boolean;
}

export function formatAttributionString(attribution?: VisualAttribution): string {
  if (!attribution) return "Educational Resource";
  const parts: string[] = [];
  if (attribution.title) parts.push(attribution.title);
  if (attribution.author) parts.push(`by ${attribution.author}`);
  if (attribution.license) parts.push(`(${attribution.license})`);
  return parts.join(" ");
}

import { EducationalVisualAsset } from "./visual-attribution";

// In-memory cache to prevent repeated external network requests
const visualCache = new Map<string, EducationalVisualAsset[]>();

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, "").trim();
}

export async function searchEducationalVisuals(
  query: string,
  limit: number = 3
): Promise<EducationalVisualAsset[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const cacheKey = `${normalizedQuery}-${limit}`;
  if (visualCache.has(cacheKey)) {
    return visualCache.get(cacheKey)!;
  }

  try {
    const encodedQuery = encodeURIComponent(query + " diagram illustration educational");
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodedQuery}&gsrlimit=${limit * 2}&prop=imageinfo&iiprop=url|size|extmetadata|mime&format=json&origin=*`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "BraynixWhiteboardTutor/2.0 (educational-nonprofit; contact@braynix.ai)",
      },
      next: { revalidate: 86400 }, // Cache for 24h in Next.js
    });

    if (!res.ok) {
      console.warn(`Wikimedia Commons search failed: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const pages = Object.values(data.query?.pages || {}) as any[];

    const assets: EducationalVisualAsset[] = [];

    for (const page of pages) {
      const ii = page.imageinfo?.[0];
      if (!ii || !ii.url) continue;

      const mime: string = ii.mime || "";
      // Only keep vector SVGs, PNGs, and JPEGs
      if (!mime.includes("svg") && !mime.includes("png") && !mime.includes("jpeg") && !mime.includes("jpg")) {
        continue;
      }

      const meta = ii.extmetadata || {};
      const authorRaw = meta.Artist?.value || meta.Credit?.value || "Wikimedia Commons Contributor";
      const author = stripHtml(authorRaw).slice(0, 80) || "Wikimedia Commons";
      const license = meta.LicenseShortName?.value || meta.UsageTerms?.value || "Creative Commons";
      const licenseUrl = meta.LicenseUrl?.value;
      const titleRaw = page.title?.replace(/^File:/, "").replace(/\.[^/.]+$/, "").replace(/_/g, " ") || query;

      assets.push({
        id: `img-${page.pageid || Math.random().toString(36).substring(2, 9)}`,
        title: titleRaw,
        url: ii.url,
        thumbUrl: ii.thumburl || ii.url,
        mimeType: mime,
        width: ii.width || 600,
        height: ii.height || 400,
        attribution: {
          title: titleRaw,
          sourceUrl: ii.descriptionurl || ii.url,
          author,
          license,
          licenseUrl,
        },
      });

      if (assets.length >= limit) break;
    }

    visualCache.set(cacheKey, assets);
    return assets;
  } catch (err) {
    console.warn("Visual search error:", err);
    return [];
  }
}

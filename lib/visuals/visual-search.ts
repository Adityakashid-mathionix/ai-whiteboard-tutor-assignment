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
  const cleanQuery = query
    .replace(/[^\w\s-]/gi, "")
    .trim()
    .toLowerCase();
  if (!cleanQuery) return [];

  const cacheKey = `${cleanQuery}-${limit}`;
  if (visualCache.has(cacheKey)) {
    return visualCache.get(cacheKey)!;
  }

  // Try natural query first, then with diagram if empty
  const queriesToTry = [cleanQuery, `${cleanQuery} diagram`];

  for (const q of queriesToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const encodedQuery = encodeURIComponent(q);
      const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodedQuery}&gsrlimit=${limit * 3}&prop=imageinfo&iiurlwidth=900&iiprop=url|size|extmetadata|mime&format=json&origin=*`;

      const res = await fetch(url, {
        headers: {
          "User-Agent": "BraynixWhiteboardTutor/2.0 (educational-nonprofit; contact@braynix.ai)",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) continue;

      const data = await res.json();
      const pages = Object.values(data.query?.pages || {}) as any[];
      if (!pages || pages.length === 0) continue;

      const assets: EducationalVisualAsset[] = [];

      for (const page of pages) {
        const ii = page.imageinfo?.[0];
        if (!ii || !ii.url) continue;

        const mime: string = (ii.mime || "").toLowerCase();
        // Keep vector SVGs, PNGs, and high-quality JPEGs
        if (!mime.includes("svg") && !mime.includes("png") && !mime.includes("jpeg") && !mime.includes("jpg")) {
          continue;
        }

        const meta = ii.extmetadata || {};
        const authorRaw = meta.Artist?.value || meta.Credit?.value || "Wikimedia Commons Contributor";
        const author = stripHtml(authorRaw).slice(0, 80) || "Wikimedia Commons";
        const license = meta.LicenseShortName?.value || meta.UsageTerms?.value || "Creative Commons";
        const licenseUrl = meta.LicenseUrl?.value;
        const titleRaw = page.title?.replace(/^File:/, "").replace(/\.[^/.]+$/, "").replace(/_/g, " ") || q;

        // Prefer thumburl or normal url
        const imgUrl = ii.thumburl || ii.url;

        assets.push({
          id: `img-${page.pageid || Math.random().toString(36).substring(2, 9)}`,
          title: titleRaw,
          url: imgUrl,
          thumbUrl: imgUrl,
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
          description: stripHtml(meta.ImageDescription?.value || titleRaw).slice(0, 160),
        });

        if (assets.length >= limit) break;
      }

      if (assets.length > 0) {
        visualCache.set(cacheKey, assets);
        return assets;
      }
    } catch (err) {
      console.warn("Visual search attempt error:", err);
    }
  }

  return [];
}

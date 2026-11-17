import { NextRequest, NextResponse } from "next/server";
import { getVisualAssetsForTopic } from "@/lib/visuals/visual-provider";
import { searchEducationalVisuals } from "@/lib/visuals/visual-search";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || searchParams.get("topic") || "";

    if (!query.trim()) {
      return NextResponse.json({ success: false, error: "Query parameter required" }, { status: 400 });
    }

    const assets = await getVisualAssetsForTopic(query, query);
    // If topic assets were empty, try raw query
    const finalAssets = assets.length > 0 ? assets : await searchEducationalVisuals(query, 3);

    return NextResponse.json({
      success: true,
      query,
      assets: finalAssets,
    });
  } catch (err) {
    console.error("API /api/visual-assets error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve educational visual assets" },
      { status: 500 }
    );
  }
}

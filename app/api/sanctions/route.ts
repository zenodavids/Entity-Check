import { NextRequest, NextResponse } from "next/server";
import { ensureSanctionsData, matchSanctions } from "@/lib/sanctions-parser";
import { cacheGet, cacheSet } from "@/lib/cache";

const SANCTIONS_MATCH_TTL = 2 * 60 * 1000;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || !q.trim()) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  const trimmed = q.trim();
  const cacheKey = `sanctions:${trimmed.toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached) return NextResponse.json(cached);

  await ensureSanctionsData();
  const matches = matchSanctions(trimmed);

  const result = { query: trimmed, matches, note: "EU sanctions data is not included in this check." };
  cacheSet(cacheKey, result, SANCTIONS_MATCH_TTL);
  return NextResponse.json(result);
}

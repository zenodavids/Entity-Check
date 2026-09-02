import { NextRequest, NextResponse } from "next/server";
import { lookupLei, searchLeiByName, detectInputType } from "@/lib/gleif";
import { cacheGet, cacheSet, LEI_TTL } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || !q.trim()) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  const trimmed = q.trim();
  const type = detectInputType(trimmed);

  if (type === "lei") {
    const cached = cacheGet(`lei:${trimmed.toUpperCase()}`);
    if (cached) return NextResponse.json(cached);

    const record = await lookupLei(trimmed);
    if (!record) {
      return NextResponse.json({ found: false, lei: trimmed.toUpperCase() });
    }

    cacheSet(`lei:${trimmed.toUpperCase()}`, { found: true, record }, LEI_TTL);
    return NextResponse.json({ found: true, record });
  }

  const cacheKey = `lei-search:${trimmed.toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached) return NextResponse.json(cached);

  const records = await searchLeiByName(trimmed);
  const result = {
    found: records.length > 0,
    query: trimmed,
    results: records.slice(0, 5),
  };

  cacheSet(cacheKey, result, LEI_TTL);
  return NextResponse.json(result);
}

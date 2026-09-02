import { NextRequest, NextResponse } from "next/server";
import { checkVat } from "@/lib/vies";
import { cacheGet, cacheSet, VAT_TTL } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || !q.trim()) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  const trimmed = q.trim().toUpperCase();
  const cacheKey = `vat:${trimmed}`;
  const cached = cacheGet(cacheKey);
  if (cached) return NextResponse.json(cached);

  const result = await checkVat(trimmed);
  cacheSet(cacheKey, result, VAT_TTL);
  return NextResponse.json(result);
}

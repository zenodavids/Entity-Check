import { NextRequest, NextResponse } from "next/server";
import { searchSanctions } from "@/lib/sanctions-parser";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Missing query parameter 'q'" },
      { status: 400 }
    );
  }

  const matches = await searchSanctions(query);
  return NextResponse.json({
    query,
    matchCount: matches.length,
    matches,
  });
}

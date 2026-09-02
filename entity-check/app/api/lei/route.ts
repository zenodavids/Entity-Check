import { NextRequest, NextResponse } from "next/server";
import { lookupLei, searchLeiByName, detectInputType } from "@/lib/gleif";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Missing query parameter 'q'" },
      { status: 400 }
    );
  }

  const inputType = detectInputType(query);

  if (inputType === "lei") {
    const lei = query.replace(/[\s\-]/g, "").toUpperCase();
    const record = await lookupLei(lei);
    if (!record) {
      return NextResponse.json({ error: "LEI not found" }, { status: 404 });
    }
    return NextResponse.json({ type: "lei", record });
  }

  if (inputType === "name") {
    const results = await searchLeiByName(query);
    return NextResponse.json({ type: "search", results });
  }

  return NextResponse.json(
    { error: "Query does not appear to be an LEI or company name" },
    { status: 400 }
  );
}

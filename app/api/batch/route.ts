import { NextRequest, NextResponse } from "next/server";
import { detectInputType, lookupLei, searchLeiByName } from "@/lib/gleif";
import { checkVat } from "@/lib/vies";
import { ensureSanctionsData, matchSanctions } from "@/lib/sanctions-parser";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const queries: string[] = body.queries;

  if (!Array.isArray(queries) || queries.length === 0) {
    return NextResponse.json(
      { error: "Expected 'queries' array" },
      { status: 400 },
    );
  }

  if (queries.length > 50) {
    return NextResponse.json(
      { error: "Maximum 50 queries per batch" },
      { status: 400 },
    );
  }
  try {
    await Promise.race([
      ensureSanctionsData(),
      new Promise((resolve) => setTimeout(resolve, 12000)),
    ]);
  } catch (err) {
    console.error(
      "Sanctions data refresh failed, continuing with cached data:",
      err,
    );
  }

  const results = await Promise.all(
    queries.map(async (q) => {
      const trimmed = q.trim();
      const type = detectInputType(trimmed);

      let lei = null;
      let vat = null;
      let sanctions = matchSanctions(trimmed);

      if (type === "lei") {
        lei = await lookupLei(trimmed);
      } else if (type === "vat") {
        vat = await checkVat(trimmed.toUpperCase());
        const vatName = vat.companyName || "";
        if (vatName) {
          sanctions = matchSanctions(vatName);
        }
      } else {
        const leiResults = await searchLeiByName(trimmed);
        lei = leiResults.length > 0 ? leiResults[0] : null;
        if (lei) {
          sanctions = matchSanctions(lei.legalName);
        }
      }

      return { query: trimmed, type, lei, vat, sanctions };
    }),
  );

  return NextResponse.json({ results });
}

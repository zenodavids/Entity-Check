import { NextRequest, NextResponse } from "next/server";
import { lookupLei, searchLeiByName, detectInputType } from "@/lib/gleif";
import { checkVat } from "@/lib/vies";
import { searchSanctions } from "@/lib/sanctions-parser";
import { CheckResult, BatchItem } from "@/lib/types";

const MAX_BATCH = 50;

async function processQuery(query: string): Promise<CheckResult> {
  const inputType = detectInputType(query);
  const result: CheckResult = {
    query,
    queryType: inputType,
    timestamp: new Date().toISOString(),
  };

  if (inputType === "lei") {
    result.lei = await lookupLei(query);
  } else if (inputType === "vat") {
    result.vat = await checkVat(query);
  } else {
    const searchResults = await searchLeiByName(query);
    if (searchResults.length > 0) {
      result.lei = await lookupLei(searchResults[0].lei);
    }
    result.vat = await checkVat(query);
  }

  result.sanctions = await searchSanctions(query);

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const queries: string[] = body.queries;

    if (!Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json(
        { error: "Body must contain a 'queries' array with at least 1 item" },
        { status: 400 }
      );
    }

    if (queries.length > MAX_BATCH) {
      return NextResponse.json(
        { error: `Maximum batch size is ${MAX_BATCH}` },
        { status: 400 }
      );
    }

    const items: BatchItem[] = await Promise.all(
      queries.map(async (q) => {
        try {
          const result = await processQuery(q.trim());
          return { query: q, status: "complete" as const, result };
        } catch (error) {
          return {
            query: q,
            status: "error" as const,
            error: String(error),
          };
        }
      })
    );

    return NextResponse.json({ items, count: items.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Batch processing failed", details: String(error) },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { refreshSanctionsData } from "@/lib/sanctions-parser";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  try {
    const data = await refreshSanctionsData();
    return NextResponse.json({
      success: true,
      ofacCount: data.ofacEntries.length,
      ukCount: data.ukEntries.length,
      lastRefresh: data.lastRefresh,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to refresh sanctions data", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}

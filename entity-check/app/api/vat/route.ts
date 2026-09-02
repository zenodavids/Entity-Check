import { NextRequest, NextResponse } from "next/server";
import { checkVat } from "@/lib/vies";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vat = searchParams.get("vat");

  if (!vat) {
    return NextResponse.json(
      { error: "Missing query parameter 'vat'" },
      { status: 400 }
    );
  }

  const result = await checkVat(vat);
  return NextResponse.json(result);
}

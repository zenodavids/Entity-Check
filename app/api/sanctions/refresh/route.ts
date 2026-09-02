import { NextResponse } from "next/server";
import { refreshSanctions } from "@/lib/sanctions-parser";

export async function POST() {
  const result = await refreshSanctions();
  return NextResponse.json(result);
}

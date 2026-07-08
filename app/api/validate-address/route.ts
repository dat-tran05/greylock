import { NextResponse } from "next/server";
import { checkAddressValid } from "@/lib/address-validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const address = typeof body?.address === "string" ? body.address : "";
  const valid = await checkAddressValid(address, process.env.GOOGLE_MAPS_API_KEY);
  return NextResponse.json({ valid });
}

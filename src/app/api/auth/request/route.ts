import { NextResponse } from "next/server";
import { requestLoginCode } from "@/lib/auth";
import { errMessage, jsonError } from "@/lib/http";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    await requestLoginCode(String(email ?? ""));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(errMessage(e));
  }
}

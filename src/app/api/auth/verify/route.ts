import { NextResponse } from "next/server";
import { verifyLoginCode } from "@/lib/auth";
import { errMessage, jsonError } from "@/lib/http";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    const user = await verifyLoginCode(String(email ?? ""), String(code ?? ""));
    return NextResponse.json({ ok: true, role: user.role });
  } catch (e) {
    return jsonError(errMessage(e));
  }
}

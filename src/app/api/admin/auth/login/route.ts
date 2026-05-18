import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

function safeCompare(a: string, b: string): boolean {
  try {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) return false;
    return timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const adminUser = process.env.ADMIN_USER ?? "";
  const adminPass = process.env.ADMIN_PASS ?? "";
  const adminToken = process.env.ADMIN_TOKEN ?? "";

  if (!adminUser || !adminPass || !adminToken) {
    return NextResponse.json({ error: "管理者設定が未完了です" }, { status: 503 });
  }

  const body = await request.json();
  const { user, pass } = body as { user?: string; pass?: string };

  if (
    !user ||
    !pass ||
    !safeCompare(user, adminUser) ||
    !safeCompare(pass, adminPass)
  ) {
    return NextResponse.json({ error: "認証失敗" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_session", adminToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7日間
  });
  return response;
}

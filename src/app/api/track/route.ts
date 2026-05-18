import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

function toJSTDateString(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const ua = request.headers.get("user-agent") ?? "";
    const visitorId = createHash("sha256").update(`${ip}:${ua}`).digest("hex");
    const date = toJSTDateString();

    await prisma.pageView.create({ data: { date, visitorId } });
    return NextResponse.json({ ok: true });
  } catch {
    // トラッキング失敗はサイレントに
    return NextResponse.json({ ok: false });
  }
}

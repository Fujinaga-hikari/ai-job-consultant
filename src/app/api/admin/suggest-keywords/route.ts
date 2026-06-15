import { NextRequest, NextResponse } from "next/server";
import { ensureKeywordQueue, suggestAndQueueKeywords } from "@/lib/article-pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function authorizeAdmin(request: NextRequest): boolean {
  const adminToken = process.env.ADMIN_TOKEN ?? "";
  if (!adminToken) return false;
  return request.cookies.get("admin_session")?.value === adminToken;
}

export async function POST(request: NextRequest) {
  if (!authorizeAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    if (typeof body.targetQueueSize === "number") {
      const target = Math.min(Math.max(Math.floor(body.targetQueueSize), 1), 30);
      const suggested = await ensureKeywordQueue(target);
      return NextResponse.json({ ok: true, suggested, count: suggested.length });
    }

    const count = typeof body.count === "number" ? Math.min(Math.max(body.count, 1), 15) : 5;
    const suggested = await suggestAndQueueKeywords(count);
    return NextResponse.json({ ok: true, suggested, count: suggested.length });
  } catch (err) {
    console.error("suggest-keywords failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

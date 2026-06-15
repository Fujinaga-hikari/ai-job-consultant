import { NextRequest, NextResponse } from "next/server";
import {
  generateArticleBySlug,
  generateNextPendingArticle,
  listKeywordRows,
} from "@/lib/article-pipeline";

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
  const requestedSlug =
    typeof body.slug === "string" && body.slug.length > 0 ? body.slug : undefined;

  try {
    if (requestedSlug) {
      const result = await generateArticleBySlug(requestedSlug);
      const remaining = (await listKeywordRows()).filter(
        (k) => k.status === "pending" || k.status === "failed",
      ).length;
      return NextResponse.json({
        ok: true,
        generated: result.slug,
        keyword: result.keyword,
        remaining,
      });
    }

    const result = await generateNextPendingArticle();
    if (!result) {
      return NextResponse.json({
        ok: true,
        message: "未生成キーワードがありません",
        generated: null,
      });
    }

    const remaining = (await listKeywordRows()).filter(
      (k) => k.status === "pending" || k.status === "failed",
    ).length;

    return NextResponse.json({
      ok: true,
      generated: result.slug,
      keyword: result.keyword,
      remaining,
    });
  } catch (err) {
    console.error("generate-articles failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

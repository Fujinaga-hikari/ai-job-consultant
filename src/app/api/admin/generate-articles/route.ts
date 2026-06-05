import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSeoArticle } from "@/lib/gemini";
import { ARTICLE_KEYWORDS } from "@/lib/article-keywords";

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

  const existingSlugs = await prisma.article.findMany({ select: { slug: true } });
  const existingSet = new Set(existingSlugs.map((a) => a.slug));
  const pending = ARTICLE_KEYWORDS.filter((k) => !existingSet.has(k.slug));

  if (pending.length === 0) {
    return NextResponse.json({ ok: true, message: "全記事生成済み", generated: [] });
  }

  // 1リクエストで1記事のみ生成（タイムアウト対策）
  const entry = pending[0];
  try {
    const { title, metaDescription, content } = await generateSeoArticle(
      entry.keyword,
      entry.titleHint
    );
    await prisma.article.create({
      data: { slug: entry.slug, keyword: entry.keyword, title, metaDescription, content },
    });
    return NextResponse.json({
      ok: true,
      generated: entry.slug,
      remaining: pending.length - 1,
    });
  } catch (err) {
    console.error(`記事生成失敗: ${entry.slug}`, err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

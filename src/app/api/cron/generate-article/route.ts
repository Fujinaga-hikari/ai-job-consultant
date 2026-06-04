import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSeoArticle } from "@/lib/gemini";
import { ARTICLE_KEYWORDS } from "@/lib/article-keywords";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function authorizeCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  return request.headers.get("x-cron-secret") === secret;
}

// ?all=true で全キーワードを一括生成（初回シード用）
export async function GET(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const all = request.nextUrl.searchParams.get("all") === "true";

  const existingSlugs = await prisma.article.findMany({ select: { slug: true } });
  const existingSet = new Set(existingSlugs.map((a) => a.slug));
  const pending = ARTICLE_KEYWORDS.filter((k) => !existingSet.has(k.slug));

  if (pending.length === 0) {
    return NextResponse.json({ ok: true, message: "全キーワードの記事生成済み", generated: [] });
  }

  const targets = all ? pending : [pending[0]];
  const generated: string[] = [];

  for (const entry of targets) {
    try {
      const { title, metaDescription, content } = await generateSeoArticle(
        entry.keyword,
        entry.titleHint
      );
      await prisma.article.create({
        data: {
          slug: entry.slug,
          keyword: entry.keyword,
          title,
          metaDescription,
          content,
        },
      });
      generated.push(entry.slug);
    } catch (err) {
      console.error(`記事生成失敗: ${entry.slug}`, err);
    }
  }

  return NextResponse.json({ ok: true, generated });
}

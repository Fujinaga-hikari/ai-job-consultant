import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchPexelsImage } from "@/lib/pexels";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function authorizeAdmin(request: NextRequest): boolean {
  const adminToken = process.env.ADMIN_TOKEN ?? "";
  if (!adminToken) return false;
  return request.cookies.get("admin_session")?.value === adminToken;
}

/** coverImage が未設定の記事に Pexels 画像を一括割り当て */
export async function POST(request: NextRequest) {
  if (!authorizeAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const articles = await prisma.article.findMany({
    where: { coverImage: null },
    select: { id: true, keyword: true },
  });

  let updated = 0;
  let failed = 0;

  for (const article of articles) {
    const url = await fetchPexelsImage(article.keyword).catch(() => null);
    if (url) {
      await prisma.article.update({
        where: { id: article.id },
        data: { coverImage: url },
      });
      updated++;
    } else {
      failed++;
    }
    // Pexels レート制限を避けるため少し待つ
    await new Promise((r) => setTimeout(r, 300));
  }

  return NextResponse.json({ ok: true, updated, failed, total: articles.length });
}

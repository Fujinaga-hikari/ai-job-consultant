import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchPexelsPhotos } from "@/lib/pexels";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function authorizeAdmin(request: NextRequest): boolean {
  const adminToken = process.env.ADMIN_TOKEN ?? "";
  if (!adminToken) return false;
  return request.cookies.get("admin_session")?.value === adminToken;
}

/** 全記事に Pexels 画像プールを一括割り当て（coverImage / imagePool が未設定のもの） */
export async function POST(request: NextRequest) {
  if (!authorizeAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const articles = await prisma.article.findMany({
    where: { imagePool: null },
    select: { id: true, keyword: true },
  });

  let updated = 0;
  let failed = 0;

  for (const article of articles) {
    const photos = await fetchPexelsPhotos(article.keyword, 5).catch(() => []);
    if (photos.length > 0) {
      await prisma.article.update({
        where: { id: article.id },
        data: {
          imagePool: JSON.stringify(photos),
          coverImage: photos[0].url,
        },
      });
      updated++;
    } else {
      failed++;
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  return NextResponse.json({ ok: true, updated, failed, total: articles.length });
}

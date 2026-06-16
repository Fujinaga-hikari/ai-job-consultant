import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { fetchPexelsPhotos, pickCover } from "@/lib/pexels";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function authorizeAdmin(request: NextRequest): boolean {
  const adminToken = process.env.ADMIN_TOKEN ?? "";
  if (!adminToken) return false;
  return request.cookies.get("admin_session")?.value === adminToken;
}

/** 全記事の coverImage / imagePool を Pexels で上書き再取得 */
export async function POST(request: NextRequest) {
  if (!authorizeAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // force=true のとき全件、デフォルトは imagePool 未設定のみ
  const body = await request.json().catch(() => ({})) as { force?: boolean };
  const force = body.force === true;

  const articles = await prisma.article.findMany({
    where: force ? {} : { imagePool: null },
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
          coverImage: pickCover(article.keyword, photos),
        },
      });
      updated++;
    } else {
      failed++;
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  // 画像URLが変わったのでブログ一覧・各記事のISRキャッシュを破棄
  revalidatePath("/blog", "layout");

  return NextResponse.json({ ok: true, updated, failed, total: articles.length });
}

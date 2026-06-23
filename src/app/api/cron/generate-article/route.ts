import { NextRequest, NextResponse } from "next/server";
import {
  getArticlePipelineConfig,
  runAutoArticlePipeline,
} from "@/lib/article-pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorizeCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  return request.headers.get("x-cron-secret") === secret;
}

// 毎日: キューを補充し、記事を生成
// ?count=N で生成本数を明示（1〜10）。?bulk=true は上限10件。
// いずれも未指定なら ARTICLE_CRON_MAX_GENERATE（既定3）。
export async function GET(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const bulk = params.get("bulk") === "true";
  const cfg = getArticlePipelineConfig();

  let maxGenerate = bulk ? 10 : cfg.cronMaxGenerate;
  const countParam = Number(params.get("count"));
  if (Number.isFinite(countParam) && countParam > 0) {
    maxGenerate = Math.min(Math.floor(countParam), 10);
  }

  try {
    const result = await runAutoArticlePipeline({
      minQueueSize: cfg.minQueueSize,
      maxGenerate,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("cron generate-article failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

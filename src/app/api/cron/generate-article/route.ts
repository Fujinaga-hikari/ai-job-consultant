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

// 毎日: キューを補充し、複数記事を生成（?bulk=true で上限10件）
export async function GET(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bulk = request.nextUrl.searchParams.get("bulk") === "true";
  const cfg = getArticlePipelineConfig();

  try {
    const result = await runAutoArticlePipeline({
      minQueueSize: cfg.minQueueSize,
      maxGenerate: bulk ? 10 : cfg.cronMaxGenerate,
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

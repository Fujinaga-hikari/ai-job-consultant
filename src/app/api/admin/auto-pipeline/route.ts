import { NextRequest, NextResponse } from "next/server";
import {
  getArticlePipelineConfig,
  runAutoArticlePipeline,
} from "@/lib/article-pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorizeAdmin(request: NextRequest): boolean {
  const adminToken = process.env.ADMIN_TOKEN ?? "";
  if (!adminToken) return false;
  return request.cookies.get("admin_session")?.value === adminToken;
}

/** AIキーワード提案 → 未生成記事を連続生成 */
export async function POST(request: NextRequest) {
  if (!authorizeAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const defaults = getArticlePipelineConfig();
  const minQueueSize =
    typeof body.minQueueSize === "number"
      ? Math.min(Math.max(body.minQueueSize, 1), 30)
      : defaults.minQueueSize;
  const maxGenerate =
    typeof body.maxGenerate === "number"
      ? Math.min(Math.max(body.maxGenerate, 1), 5)
      : Math.min(defaults.cronMaxGenerate, 5);

  try {
    const result = await runAutoArticlePipeline({ minQueueSize, maxGenerate });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("auto-pipeline failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

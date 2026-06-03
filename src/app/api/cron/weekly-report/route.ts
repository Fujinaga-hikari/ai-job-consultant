import { NextRequest, NextResponse } from "next/server";
import { runWeeklyReport } from "@/lib/weekly-report";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorizeCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET is not set");
    return false;
  }

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  // 手動実行用（ローカル・緊急時）
  const headerSecret = request.headers.get("x-cron-secret");
  return headerSecret === secret;
}

export async function GET(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runWeeklyReport({ sendEmail: true });
    return NextResponse.json({
      ok: true,
      periodLabel: result.metrics.periodLabel,
      emailed: result.emailed,
      summary: result.metrics.thisWeek,
    });
  } catch (err) {
    console.error("weekly-report cron failed:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

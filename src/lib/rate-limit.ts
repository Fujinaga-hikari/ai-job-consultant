import { prisma } from "./prisma";

const DAILY_LIMIT = 3;
const BURST_INTERVAL_MS = 1000; // 1秒以内の連続リクエストをブロック

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: string; retryAfterSeconds?: number };

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const now = new Date();

  const existing = await prisma.rateLimit.findUnique({
    where: { ip_date: { ip, date: today } },
  });

  // バースト防止: 前回リクエストから1秒以内
  if (existing) {
    const elapsed = now.getTime() - existing.lastRequest.getTime();
    if (elapsed < BURST_INTERVAL_MS) {
      return {
        allowed: false,
        reason: "リクエストが速すぎます。少し待ってから再試行してください。",
        retryAfterSeconds: 1,
      };
    }
  }

  // 日次制限チェック
  if (existing && existing.count >= DAILY_LIMIT) {
    return {
      allowed: false,
      reason: `本日の生成回数上限（${DAILY_LIMIT}回）に達しました。明日以降に再度お試しください。`,
    };
  }

  // カウント更新 or 作成
  await prisma.rateLimit.upsert({
    where: { ip_date: { ip, date: today } },
    update: { count: { increment: 1 }, lastRequest: now },
    create: { ip, date: today, count: 1, lastRequest: now },
  });

  return { allowed: true };
}

export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers);
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

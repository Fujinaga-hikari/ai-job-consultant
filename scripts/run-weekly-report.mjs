/**
 * ローカル / 手動実行（.env に CRON_SECRET と URL を設定）:
 *   npm run weekly-report
 *
 * 本番 API 直接:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://lp.mixjob.co.jp/api/cron/weekly-report
 */
const baseUrl = (
  process.env.WEEKLY_REPORT_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");
const secret = process.env.CRON_SECRET;

if (!secret) {
  console.error("CRON_SECRET is not set");
  process.exit(1);
}

const res = await fetch(`${baseUrl}/api/cron/weekly-report`, {
  headers: { Authorization: `Bearer ${secret}` },
});

const body = await res.text();
console.log(res.status, body);
process.exit(res.ok ? 0 : 1);

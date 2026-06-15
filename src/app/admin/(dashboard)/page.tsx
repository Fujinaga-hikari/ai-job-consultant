import { prisma } from "@/lib/prisma";
import { TrendChart, WeeklyBarChart } from "../components/DashboardCharts";
import type { DailyDataPoint, WeeklyDataPoint } from "../components/DashboardCharts";
import GenerateArticlesButton from "../components/GenerateArticlesButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toJST(date: Date) {
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
}

function formatDate(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getWeekLabel(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}週`;
}

async function getBlogStats() {
  const now = toJST(new Date());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalBlogPV, weekBlogPV, monthBlogPV,
    totalCtaClicks, weekCtaClicks, monthCtaClicks,
    articles,
    articlePVCounts,
    articleCtaCounts,
  ] = await Promise.all([
    prisma.pageView.count({ where: { path: { startsWith: "/blog" } } }),
    prisma.pageView.count({ where: { path: { startsWith: "/blog" }, createdAt: { gte: startOfWeek } } }),
    prisma.pageView.count({ where: { path: { startsWith: "/blog" }, createdAt: { gte: startOfMonth } } }),
    prisma.ctaClick.count(),
    prisma.ctaClick.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.ctaClick.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.article.findMany({
      select: { slug: true, title: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.pageView.groupBy({
      by: ["path"],
      where: { path: { startsWith: "/blog/" } },
      _count: { id: true },
    }),
    prisma.ctaClick.groupBy({
      by: ["slug"],
      _count: { id: true },
    }),
  ]);

  const totalBlogUU = await prisma.pageView
    .groupBy({ by: ["visitorId"], where: { path: { startsWith: "/blog" } } })
    .then((r) => r.length);

  const pvBySlug = new Map(articlePVCounts.map((r) => [r.path.replace("/blog/", ""), r._count.id]));
  const ctaBySlug = new Map(articleCtaCounts.map((r) => [r.slug, r._count.id]));

  return {
    totalBlogPV, weekBlogPV, monthBlogPV, totalBlogUU,
    totalCtaClicks, weekCtaClicks, monthCtaClicks,
    articles: articles.map((a) => ({
      ...a,
      pv: pvBySlug.get(a.slug) ?? 0,
      cta: ctaBySlug.get(a.slug) ?? 0,
    })),
  };
}

async function getStats() {
  const now = toJST(new Date());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  const eightWeeksAgo = new Date(now);
  eightWeeksAgo.setDate(now.getDate() - 55);

  const [
    totalLeads,
    weekLeads,
    monthLeads,
    totalGenerations,
    weekGenerations,
    monthGenerations,
    recentLeads,
    last30Leads,
    last30Generations,
    last8wLeads,
    last8wGenerations,
    totalPV,
    weekPV,
    monthPV,
    last30PageViews,
    last8wPageViews,
  ] = await Promise.all([
    prisma.consultation.count(),
    prisma.consultation.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.consultation.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.generationLog.count(),
    prisma.generationLog.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.generationLog.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.consultation.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, email: true, name: true, companyName: true, createdAt: true },
    }),
    prisma.consultation.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.generationLog.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.consultation.findMany({
      where: { createdAt: { gte: eightWeeksAgo } },
      select: { createdAt: true },
    }),
    prisma.generationLog.findMany({
      where: { createdAt: { gte: eightWeeksAgo } },
      select: { createdAt: true },
    }),
    prisma.pageView.count(),
    prisma.pageView.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.pageView.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.pageView.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { date: true, visitorId: true },
    }),
    prisma.pageView.findMany({
      where: { createdAt: { gte: eightWeeksAgo } },
      select: { date: true, visitorId: true, createdAt: true },
    }),
  ]);

  // UU集計（期間内のdistinct visitorId）
  const totalUU = await prisma.pageView.groupBy({ by: ["visitorId"] }).then((r) => r.length);
  const weekUU = await prisma.pageView
    .groupBy({ by: ["visitorId"], where: { createdAt: { gte: startOfWeek } } })
    .then((r) => r.length);
  const monthUU = await prisma.pageView
    .groupBy({ by: ["visitorId"], where: { createdAt: { gte: startOfMonth } } })
    .then((r) => r.length);

  // 30日間の日別データ
  const dailyMap = new Map<string, DailyDataPoint>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    dailyMap.set(formatDate(d), { date: formatDate(d), 問い合わせ: 0, 生成数: 0, PV: 0, UU: 0 });
  }
  for (const r of last30Leads) {
    const key = formatDate(toJST(r.createdAt));
    const entry = dailyMap.get(key);
    if (entry) entry.問い合わせ++;
  }
  for (const r of last30Generations) {
    const key = formatDate(toJST(r.createdAt));
    const entry = dailyMap.get(key);
    if (entry) entry.生成数++;
  }
  // PV/UU per day
  const dailyVisitors = new Map<string, Set<string>>();
  for (const r of last30PageViews) {
    const entry = dailyMap.get(r.date);
    if (entry) {
      entry.PV++;
      if (!dailyVisitors.has(r.date)) dailyVisitors.set(r.date, new Set());
      dailyVisitors.get(r.date)!.add(r.visitorId);
    }
  }
  for (const [date, visitors] of dailyVisitors) {
    const entry = dailyMap.get(date);
    if (entry) entry.UU = visitors.size;
  }
  const dailyData = Array.from(dailyMap.values());

  // 週別データ（直近8週、月曜起算）
  const weeklyMap = new Map<string, WeeklyDataPoint>();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - now.getDay() + 1 - i * 7);
    const label = getWeekLabel(d);
    weeklyMap.set(label, { week: label, 問い合わせ: 0, 生成数: 0, PV: 0, UU: 0 });
  }
  for (const r of last8wLeads) {
    const d = toJST(r.createdAt);
    const mon = new Date(d);
    mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const label = getWeekLabel(mon);
    const entry = weeklyMap.get(label);
    if (entry) entry.問い合わせ++;
  }
  for (const r of last8wGenerations) {
    const d = toJST(r.createdAt);
    const mon = new Date(d);
    mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const label = getWeekLabel(mon);
    const entry = weeklyMap.get(label);
    if (entry) entry.生成数++;
  }
  const weeklyVisitors = new Map<string, Set<string>>();
  for (const r of last8wPageViews) {
    const d = toJST(r.createdAt);
    const mon = new Date(d);
    mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const label = getWeekLabel(mon);
    const entry = weeklyMap.get(label);
    if (entry) {
      entry.PV++;
      if (!weeklyVisitors.has(label)) weeklyVisitors.set(label, new Set());
      weeklyVisitors.get(label)!.add(r.visitorId);
    }
  }
  for (const [label, visitors] of weeklyVisitors) {
    const entry = weeklyMap.get(label);
    if (entry) entry.UU = visitors.size;
  }
  const weeklyData = Array.from(weeklyMap.values());

  // コンバージョン率
  const conversionRate =
    totalGenerations > 0
      ? ((totalLeads / totalGenerations) * 100).toFixed(1)
      : "0.0";

  return {
    totalLeads, weekLeads, monthLeads,
    totalGenerations, weekGenerations, monthGenerations,
    conversionRate,
    totalPV, weekPV, monthPV,
    totalUU, weekUU, monthUU,
    recentLeads,
    dailyData,
    weeklyData,
  };
}

function KpiCard({
  label,
  value,
  unit = "",
  sub,
  color = "brand",
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  color?: "brand" | "orange" | "green" | "indigo" | "cyan";
}) {
  const accentMap = { brand: "#e84730", orange: "#f2971b", green: "#16a34a", indigo: "#6366f1", cyan: "#06b6d4" };
  const accent = accentMap[color ?? "brand"];
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border-l-4" style={{ borderColor: accent }}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-4xl font-bold mt-1" style={{ color: accent }}>
        {typeof value === "number" ? value.toLocaleString() : value}
        {unit && <span className="text-xl ml-1">{unit}</span>}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default async function AdminDashboard() {
  const [stats, blogStats] = await Promise.all([getStats(), getBlogStats()]);
  const articleCount = blogStats.articles.length;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>

      {/* ブログ管理 */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          ブログ記事管理
        </h2>
        <div className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-gray-500">公開記事数</p>
            <p className="text-3xl font-bold text-[#e84730]">{articleCount}<span className="text-lg ml-1">件</span></p>
            <p className="text-xs text-gray-400 mt-1">記事生成は管理画面のボタン操作のみ</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <GenerateArticlesButton />
            <a href="/admin/articles" className="text-sm text-[#e84730] hover:underline">
              キーワードを選んで生成 →
            </a>
          </div>
        </div>
      </section>

      {/* KPI：PV / UU */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          アクセス（PV / UU）
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <KpiCard label="累計 PV" value={stats.totalPV} color="indigo" />
          <KpiCard label="今月 PV" value={stats.monthPV} color="indigo" />
          <KpiCard label="今週 PV" value={stats.weekPV} color="indigo" />
          <KpiCard label="累計 UU" value={stats.totalUU} color="cyan" />
          <KpiCard label="今月 UU" value={stats.monthUU} color="cyan" />
          <KpiCard label="今週 UU" value={stats.weekUU} color="cyan" />
        </div>
      </section>

      {/* KPI：問い合わせ */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          問い合わせ（リード）
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard label="累計" value={stats.totalLeads} />
          <KpiCard label="今月" value={stats.monthLeads} />
          <KpiCard label="今週" value={stats.weekLeads} />
          <KpiCard
            label="コンバージョン率"
            value={stats.conversionRate}
            unit="%"
            sub="問い合わせ / 生成数"
            color="green"
          />
        </div>
      </section>

      {/* KPI：AI生成 */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          AI求人生成
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard label="累計" value={stats.totalGenerations} color="orange" />
          <KpiCard label="今月" value={stats.monthGenerations} color="orange" />
          <KpiCard label="今週" value={stats.weekGenerations} color="orange" />
        </div>
      </section>

      {/* グラフ */}
      <section className="space-y-4">
        <TrendChart data={stats.dailyData} />
        <WeeklyBarChart data={stats.weeklyData} />
      </section>

      {/* ブログ統計 */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          ブログ（PV / UU / LP遷移）
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <KpiCard label="ブログ 累計PV" value={blogStats.totalBlogPV} color="indigo" />
          <KpiCard label="今月PV" value={blogStats.monthBlogPV} color="indigo" />
          <KpiCard label="今週PV" value={blogStats.weekBlogPV} color="indigo" />
          <KpiCard label="ブログ 累計UU" value={blogStats.totalBlogUU} color="cyan" />
          <KpiCard label="CTA遷移 累計" value={blogStats.totalCtaClicks} color="green" sub="ブログ→LP" />
          <KpiCard label="CTA遷移 今月" value={blogStats.monthCtaClicks} color="green" />
        </div>

        {blogStats.articles.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">記事タイトル</th>
                  <th className="text-right px-4 py-3 font-medium">PV</th>
                  <th className="text-right px-4 py-3 font-medium">LP遷移</th>
                  <th className="text-right px-4 py-3 font-medium">遷移率</th>
                  <th className="text-left px-4 py-3 font-medium">公開日</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {blogStats.articles.map((a) => (
                  <tr key={a.slug} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">
                      <a href={`/blog/${a.slug}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#e84730]">
                        {a.title}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{a.pv}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-green-600 font-semibold">{a.cta}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-500">
                      {a.pv > 0 ? `${((a.cta / a.pv) * 100).toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                      {new Date(a.publishedAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 直近の問い合わせ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            直近の問い合わせ
          </h2>
          <a href="/admin/leads" className="text-sm text-[#e84730] hover:underline">
            すべて見る →
          </a>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-4 py-3 font-medium">日時</th>
                <th className="text-left px-4 py-3 font-medium">氏名</th>
                <th className="text-left px-4 py-3 font-medium">会社名</th>
                <th className="text-left px-4 py-3 font-medium">メール</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.recentLeads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    まだ問い合わせはありません
                  </td>
                </tr>
              ) : (
                stats.recentLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(lead.createdAt).toLocaleString("ja-JP", {
                        timeZone: "Asia/Tokyo",
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">{lead.name ?? "—"}</td>
                    <td className="px-4 py-3">{lead.companyName ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.email}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

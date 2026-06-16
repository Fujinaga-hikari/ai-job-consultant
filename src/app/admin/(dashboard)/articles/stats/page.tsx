import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "記事パフォーマンス | MixJob管理画面" };

const PER_PAGE = 20;

type SortKey = "pv" | "cta" | "rate" | "date";
type SortDir = "asc" | "desc";

function toJST(date: Date) {
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
}

function SortLink({
  href,
  label,
  active,
  dir,
}: {
  href: string;
  label: string;
  active: boolean;
  dir: SortDir;
}) {
  return (
    <Link href={href} className={`flex items-center gap-1 hover:text-gray-800 transition-colors ${active ? "text-[#e84730]" : ""}`}>
      {label}
      <span className="text-xs">{active ? (dir === "desc" ? "↓" : "↑") : "↕"}</span>
    </Link>
  );
}

export default async function ArticleStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string; page?: string }>;
}) {
  const { sort, dir, page: pageStr } = await searchParams;
  const sortKey: SortKey = (["pv", "cta", "rate", "date"].includes(sort ?? "") ? sort : "pv") as SortKey;
  const sortDir: SortDir = dir === "asc" ? "asc" : "desc";
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));

  const now = toJST(new Date());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalBlogPV, weekBlogPV, monthBlogPV,
    totalCtaClicks, weekCtaClicks, monthCtaClicks,
    totalCount,
    articlePVCounts,
    articleCtaCounts,
  ] = await Promise.all([
    prisma.pageView.count({ where: { path: { startsWith: "/blog" } } }),
    prisma.pageView.count({ where: { path: { startsWith: "/blog" }, createdAt: { gte: startOfWeek } } }),
    prisma.pageView.count({ where: { path: { startsWith: "/blog" }, createdAt: { gte: startOfMonth } } }),
    prisma.ctaClick.count(),
    prisma.ctaClick.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.ctaClick.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.article.count(),
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

  const pvBySlug = new Map(
    articlePVCounts.map((r) => [r.path.replace("/blog/", ""), r._count.id])
  );
  const ctaBySlug = new Map(
    articleCtaCounts.map((r) => [r.slug, r._count.id])
  );

  // Fetch all articles for sorting
  const allArticles = await prisma.article.findMany({
    select: { slug: true, title: true, keyword: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
  });

  const rows = allArticles.map((a) => {
    const pv = pvBySlug.get(a.slug) ?? 0;
    const cta = ctaBySlug.get(a.slug) ?? 0;
    const rate = pv > 0 ? (cta / pv) * 100 : 0;
    return { ...a, pv, cta, rate };
  });

  // Sort
  rows.sort((a, b) => {
    let diff = 0;
    if (sortKey === "pv") diff = a.pv - b.pv;
    else if (sortKey === "cta") diff = a.cta - b.cta;
    else if (sortKey === "rate") diff = a.rate - b.rate;
    else diff = a.publishedAt.getTime() - b.publishedAt.getTime();
    return sortDir === "desc" ? -diff : diff;
  });

  const totalPages = Math.ceil(totalCount / PER_PAGE);
  const pagedRows = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function sortHref(key: SortKey) {
    const newDir = sortKey === key && sortDir === "desc" ? "asc" : "desc";
    return `/admin/articles/stats?sort=${key}&dir=${newDir}&page=1`;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">記事パフォーマンス</h1>
        <p className="text-sm text-gray-500 mt-1">公開 {totalCount} 件</p>
      </div>

      {/* タブナビ */}
      <div className="flex gap-1 border-b border-gray-200">
        <Link
          href="/admin/articles"
          className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          記事一覧
        </Link>
        <span className="px-4 py-2 text-sm font-semibold text-[#e84730] border-b-2 border-[#e84730] -mb-px">
          パフォーマンス
        </span>
      </div>

      {/* KPIサマリ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(
          [
            { label: "ブログ累計PV", value: totalBlogPV, sub: `今月 ${monthBlogPV} / 今週 ${weekBlogPV}`, color: "#6366f1" },
            { label: "ブログ累計UU", value: totalBlogUU, sub: "ユニークユーザー合計", color: "#06b6d4" },
            { label: "CTA遷移 累計", value: totalCtaClicks, sub: `今月 ${monthCtaClicks} / 今週 ${weekCtaClicks}`, color: "#16a34a" },
            {
              label: "平均転換率",
              value: totalBlogPV > 0 ? `${((totalCtaClicks / totalBlogPV) * 100).toFixed(1)}%` : "—",
              sub: "CTA / PV",
              color: "#e84730",
            },
          ] as const
        ).map(({ label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm p-5 border-l-4" style={{ borderColor: color }}>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-bold mt-1" style={{ color }}>
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* 月次・週次ブレークダウン */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "今月 PV", value: monthBlogPV },
          { label: "今月 CTA", value: monthCtaClicks },
          {
            label: "今月 転換率",
            value: monthBlogPV > 0 ? `${((monthCtaClicks / monthBlogPV) * 100).toFixed(1)}%` : "—",
          },
          { label: "今週 PV", value: weekBlogPV },
          { label: "今週 CTA", value: weekCtaClicks },
          {
            label: "今週 転換率",
            value: weekBlogPV > 0 ? `${((weekCtaClicks / weekBlogPV) * 100).toFixed(1)}%` : "—",
          },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-xl font-bold text-gray-800 mt-0.5">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          </div>
        ))}
      </div>

      {/* 記事別テーブル */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          記事別パフォーマンス
        </h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3 font-medium">タイトル</th>
                <th className="text-left px-4 py-3 font-medium">キーワード</th>
                <th className="text-right px-4 py-3 font-medium">
                  <SortLink href={sortHref("pv")} label="PV" active={sortKey === "pv"} dir={sortDir} />
                </th>
                <th className="text-right px-4 py-3 font-medium">
                  <SortLink href={sortHref("cta")} label="LP遷移" active={sortKey === "cta"} dir={sortDir} />
                </th>
                <th className="text-right px-4 py-3 font-medium">
                  <SortLink href={sortHref("rate")} label="遷移率" active={sortKey === "rate"} dir={sortDir} />
                </th>
                <th className="text-left px-4 py-3 font-medium">
                  <SortLink href={sortHref("date")} label="公開日" active={sortKey === "date"} dir={sortDir} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    記事がありません
                  </td>
                </tr>
              ) : (
                pagedRows.map((article) => (
                  <tr key={article.slug} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-800 max-w-xs">
                      <a
                        href={`/blog/${article.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#e84730] truncate block"
                      >
                        {article.title}
                      </a>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-block text-xs font-semibold text-[#e84730] bg-red-50 px-2 py-1 rounded-full whitespace-nowrap">
                        {article.keyword}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums text-gray-700">{article.pv}</td>
                    <td className="px-4 py-4 text-right tabular-nums font-semibold text-green-600">
                      {article.cta}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums text-gray-500">
                      {article.pv > 0 ? `${article.rate.toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-4 py-4 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(article.publishedAt).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            {page > 1 && (
              <Link
                href={`/admin/articles/stats?sort=${sortKey}&dir=${sortDir}&page=${page - 1}`}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                ← 前へ
              </Link>
            )}
            <span className="text-sm text-gray-500">
              {page} / {totalPages} ページ
            </span>
            {page < totalPages && (
              <Link
                href={`/admin/articles/stats?sort=${sortKey}&dir=${sortDir}&page=${page + 1}`}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                次へ →
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

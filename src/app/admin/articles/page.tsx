import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ARTICLE_KEYWORDS } from "@/lib/article-keywords";
import ArticleGenerator from "@/components/admin/ArticleGenerator";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ブログ記事管理 | MixJob管理画面" };

export default async function AdminArticlesPage() {
  const articles = await prisma.article.findMany({
    orderBy: { publishedAt: "desc" },
  });

  const existingSlugs = new Set(articles.map((a) => a.slug));
  const remaining = ARTICLE_KEYWORDS.filter((k) => !existingSlugs.has(k.slug)).length;

  const slugStats = articles.length > 0
    ? await Promise.all([
        prisma.pageView.groupBy({
          by: ["path"],
          where: { path: { in: articles.map((a) => `/blog/${a.slug}`) } },
          _count: { id: true },
        }),
        prisma.ctaClick.groupBy({
          by: ["slug"],
          where: { slug: { in: articles.map((a) => a.slug) } },
          _count: { id: true },
        }),
      ])
    : [[], []];

  const pvBySlug = new Map(
    (slugStats[0] as { path: string; _count: { id: number } }[]).map((r) => [
      r.path.replace("/blog/", ""),
      r._count.id,
    ])
  );
  const ctaBySlug = new Map(
    (slugStats[1] as { slug: string; _count: { id: number } }[]).map((r) => [
      r.slug,
      r._count.id,
    ])
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">ブログ記事</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{articles.length}件</span>
          <ArticleGenerator remaining={remaining} />
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-400">
          記事がまだありません。ダッシュボードから生成してください。
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3 font-medium">タイトル</th>
                <th className="text-left px-4 py-3 font-medium">キーワード</th>
                <th className="text-right px-4 py-3 font-medium">PV</th>
                <th className="text-right px-4 py-3 font-medium">LP遷移</th>
                <th className="text-right px-4 py-3 font-medium">遷移率</th>
                <th className="text-left px-4 py-3 font-medium">公開日</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {articles.map((article) => {
                const pv = pvBySlug.get(article.slug) ?? 0;
                const cta = ctaBySlug.get(article.slug) ?? 0;
                const rate = pv > 0 ? `${((cta / pv) * 100).toFixed(1)}%` : "—";
                return (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-800 max-w-xs">
                      <p className="truncate">{article.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 font-normal truncate">
                        {article.metaDescription}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-block text-xs font-semibold text-[#e84730] bg-red-50 px-2 py-1 rounded-full whitespace-nowrap">
                        {article.keyword}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums text-gray-700">{pv}</td>
                    <td className="px-4 py-4 text-right tabular-nums font-semibold text-green-600">{cta}</td>
                    <td className="px-4 py-4 text-right tabular-nums text-gray-500">{rate}</td>
                    <td className="px-4 py-4 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(article.publishedAt).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <a
                        href={`/blog/${article.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#e84730] hover:underline whitespace-nowrap"
                      >
                        記事を見る →
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { listKeywordRows } from "@/lib/article-pipeline";
import KeywordArticlePanel from "@/components/admin/KeywordArticlePanel";
import BackfillImagesButton from "@/components/admin/BackfillImagesButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ブログ記事管理 | MixJob管理画面" };

const PER_PAGE = 10;

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));

  const [keywordRows, totalCount] = await Promise.all([
    listKeywordRows(),
    prisma.article.count(),
  ]);

  const articles = await prisma.article.findMany({
    orderBy: { publishedAt: "desc" },
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE,
    select: {
      id: true,
      slug: true,
      keyword: true,
      title: true,
      publishedAt: true,
      coverImage: true,
      imagePool: true,
    },
  });

  const totalPages = Math.ceil(totalCount / PER_PAGE);

  const pendingCount = keywordRows.filter(
    (k) => k.status === "pending" || k.status === "failed",
  ).length;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ブログ記事</h1>
          <p className="text-sm text-gray-500 mt-1">
            公開 {totalCount} 件 · 未生成キーワード {pendingCount} 件
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <BackfillImagesButton />
          <Link
            href="/blog"
            target="_blank"
            className="text-sm text-[#e84730] hover:underline"
          >
            公開ブログを見る →
          </Link>
        </div>
      </div>

      {/* タブナビ */}
      <div className="flex gap-1 border-b border-gray-200">
        <span className="px-4 py-2 text-sm font-semibold text-[#e84730] border-b-2 border-[#e84730] -mb-px">
          記事一覧
        </span>
        <Link
          href="/admin/articles/stats"
          className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          パフォーマンス
        </Link>
      </div>

      <KeywordArticlePanel keywords={keywordRows} />

      {articles.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            公開済み記事
          </h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">タイトル</th>
                  <th className="text-left px-4 py-3 font-medium">キーワード</th>
                  <th className="text-center px-4 py-3 font-medium">画像</th>
                  <th className="text-left px-4 py-3 font-medium">公開日</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {articles.map((article) => {
                  const hasImages = !!article.imagePool;
                  return (
                    <tr key={article.id} className="hover:bg-gray-50">
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
                      <td className="px-4 py-4 text-center">
                        {hasImages ? (
                          <span className="text-green-600 text-xs font-semibold">✓ Pexels</span>
                        ) : (
                          <span className="text-gray-300 text-xs">未取得</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(article.publishedAt).toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              {page > 1 && (
                <Link
                  href={`/admin/articles?page=${page - 1}`}
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
                  href={`/admin/articles?page=${page + 1}`}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  次へ →
                </Link>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

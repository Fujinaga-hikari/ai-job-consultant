import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { LOCAL_POOL } from "@/lib/article-images";

const PER_PAGE = 12;

export const metadata: Metadata = {
  title: "採用コラム | MixJob",
  description:
    "採用担当者向けに求人票の書き方、例文、テンプレートを解説。AIを活用して応募が集まる求人原稿を作る方法も紹介します。",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        slug: true,
        title: true,
        metaDescription: true,
        keyword: true,
        publishedAt: true,
        coverImage: true,
        imagePool: true,
      },
    }),
    prisma.article.count(),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="screen">
      <Header />
      <main className="blog-list-page">
        <div className="blog-list-inner">
          <div className="blog-list-header">
            <p className="section-eyebrow">COLUMN</p>
            <h1 className="section-title">採用コラム</h1>
            <p className="section-sub">
              採用担当者向けに求人票の書き方・例文・コツを解説します。
            </p>
          </div>

          {articles.length === 0 ? (
            <p className="blog-empty">記事を準備中です。しばらくお待ちください。</p>
          ) : (
            <>
              <ul className="blog-card-list">
                {articles.map((article, index) => {
                  const globalIndex = (page - 1) * PER_PAGE + index;
                  const poolFirst = article.imagePool
                    ? (() => { try { return (JSON.parse(article.imagePool) as { url: string }[])[0]?.url; } catch { return undefined; } })()
                    : undefined;
                  const cardImage = article.coverImage ?? poolFirst ?? LOCAL_POOL[globalIndex % LOCAL_POOL.length];
                  const dateStr = new Date(article.publishedAt).toLocaleDateString(
                    "ja-JP",
                    { year: "numeric", month: "long", day: "numeric" }
                  );
                  return (
                    <li key={article.slug}>
                      <Link href={`/blog/${article.slug}`} className="blog-card">
                        <div className="blog-card-thumb">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={cardImage}
                            alt=""
                            width={800}
                            height={450}
                            loading={index < 3 ? "eager" : "lazy"}
                            className="blog-card-img"
                          />
                        </div>
                        <div className="blog-card-body">
                          <div className="blog-card-meta">
                            <span className="blog-card-keyword">
                              {article.keyword}
                            </span>
                            <time className="blog-card-date">{dateStr}</time>
                          </div>
                          <h2 className="blog-card-title">{article.title}</h2>
                          <p className="blog-card-desc">{article.metaDescription}</p>
                          <div className="blog-card-footer">
                            <span className="blog-card-cta">
                              詳しく見る
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M5 12h14M12 5l7 7-7 7" />
                              </svg>
                            </span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {totalPages > 1 && (
                <nav className="pagination" aria-label="ページネーション">
                  {page > 1 ? (
                    <Link href={`/blog?page=${page - 1}`} className="pagination-btn">
                      ← 前へ
                    </Link>
                  ) : (
                    <span className="pagination-btn is-disabled">← 前へ</span>
                  )}

                  <div className="pagination-pages">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <Link
                        key={p}
                        href={`/blog?page=${p}`}
                        className={`pagination-page${p === page ? " is-active" : ""}`}
                        aria-current={p === page ? "page" : undefined}
                      >
                        {p}
                      </Link>
                    ))}
                  </div>

                  {page < totalPages ? (
                    <Link href={`/blog?page=${page + 1}`} className="pagination-btn">
                      次へ →
                    </Link>
                  ) : (
                    <span className="pagination-btn is-disabled">次へ →</span>
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </main>
      <Footer showPexels />
    </div>
  );
}

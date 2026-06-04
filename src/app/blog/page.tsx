import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "採用・求人票の書き方ガイド | MixJob",
  description:
    "採用担当者向けに求人票の書き方、例文、テンプレートを解説。AIを活用して応募が集まる求人原稿を作る方法も紹介します。",
};

export default async function BlogPage() {
  const articles = await prisma.article.findMany({
    orderBy: { publishedAt: "desc" },
    select: { slug: true, title: true, metaDescription: true, keyword: true, publishedAt: true },
  });

  return (
    <div className="screen">
      <Header />
      <main className="blog-list-page">
        <div className="blog-list-inner">
          <div className="blog-list-header">
            <p className="section-eyebrow">GUIDE</p>
            <h1 className="section-title">採用・求人票の書き方ガイド</h1>
            <p className="section-sub">
              採用担当者向けに求人票の書き方・例文・コツを解説します。
            </p>
          </div>

          {articles.length === 0 ? (
            <p className="blog-empty">記事を準備中です。しばらくお待ちください。</p>
          ) : (
            <ul className="blog-card-list">
              {articles.map((article) => (
                <li key={article.slug}>
                  <Link href={`/blog/${article.slug}`} className="blog-card">
                    <span className="blog-card-keyword">{article.keyword}</span>
                    <h2 className="blog-card-title">{article.title}</h2>
                    <p className="blog-card-desc">{article.metaDescription}</p>
                    <span className="blog-card-date">
                      {new Date(article.publishedAt).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

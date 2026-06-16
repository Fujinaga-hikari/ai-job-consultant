import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ArticleCtaLink from "@/components/ArticleCtaLink";
import ArticleBody from "@/components/ArticleBody";
import ArticleAuthor from "@/components/ArticleAuthor";
import RelatedArticles from "@/components/RelatedArticles";
import { prisma } from "@/lib/prisma";
import { parseFaq } from "@/lib/article-faq";

export const revalidate = 3600;
export const dynamicParams = true;

const SITE_URL = "https://lp.mixjob.co.jp";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) return {};
  return {
    title: `${article.title} | MixJob`,
    description: article.metaDescription,
    alternates: { canonical: `/blog/${slug}` },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) notFound();

  const faqItems = parseFaq(article.content);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.publishedAt.toISOString(),
    dateModified: article.publishedAt.toISOString(),
    author: {
      "@type": "Organization",
      name: "MixJob編集部",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "MixJob",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo_mixjob.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${slug}`,
    },
    url: `${SITE_URL}/blog/${slug}`,
    inLanguage: "ja-JP",
    image: `${SITE_URL}/images/articles/pixta_117916914_S.jpg`,
    keywords: article.keyword,
  };

  const faqJsonLd =
    faqItems.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map(({ q, a }) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
          })),
        }
      : null;

  return (
    <div className="screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <Header />
      <main className="article-page">
        <div className="article-page-inner">
          <div className="article-breadcrumb">
            <Link href="/">ホーム</Link>
            <span> / </span>
            <Link href="/blog">ガイド</Link>
            <span> / </span>
            <span>{article.title}</span>
          </div>

          <article className="article-body">
            <header className="article-header">
              <span className="blog-card-keyword">{article.keyword}</span>
              <h1 className="article-title">{article.title}</h1>
              <p className="article-date">
                {new Date(article.publishedAt).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </header>

            <ArticleBody content={article.content} />
            <ArticleAuthor />
          </article>

          {/* CTA */}
          <div className="article-cta">
            <div className="article-cta-inner">
              <p className="article-cta-eyebrow">無料で試す</p>
              <h2 className="article-cta-title">
                AIが求人票を自動で作成します
              </h2>
              <p className="article-cta-desc">
                職種・業務内容を入力するだけで、応募者の心を掴む求人原稿を3分で生成。
                採用のプロへの無料相談もついています。
              </p>
              <ArticleCtaLink slug={article.slug} />
            </div>
          </div>

          <RelatedArticles currentSlug={slug} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

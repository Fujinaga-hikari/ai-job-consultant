import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function RelatedArticles({ currentSlug }: { currentSlug: string }) {
  const articles = await prisma.article.findMany({
    where: { slug: { not: currentSlug } },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: { slug: true, title: true, keyword: true, metaDescription: true },
  });

  if (articles.length === 0) return null;

  return (
    <section className="related-articles">
      <h2 className="related-articles-title">関連記事</h2>
      <ul className="related-articles-list">
        {articles.map((article) => (
          <li key={article.slug}>
            <Link href={`/blog/${article.slug}`} className="related-article-card">
              <span className="blog-card-keyword">{article.keyword}</span>
              <h3 className="related-article-title">{article.title}</h3>
              <p className="related-article-desc">{article.metaDescription}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

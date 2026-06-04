import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://lp.mixjob.co.jp").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await prisma.article.findMany({
    select: { slug: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
  });

  const articleUrls: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${siteUrl}/blog/${a.slug}`,
    lastModified: a.publishedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...articleUrls,
  ];
}

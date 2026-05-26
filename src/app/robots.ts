import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://lp.mixjob.co.jp").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

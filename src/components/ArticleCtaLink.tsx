"use client";

import Link from "next/link";

export default function ArticleCtaLink({ slug }: { slug: string }) {
  function handleClick() {
    fetch("/api/track/cta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    }).catch(() => {});
  }

  return (
    <Link href="/" className="article-cta-btn" onClick={handleClick}>
      無料で求人票を生成する →
    </Link>
  );
}

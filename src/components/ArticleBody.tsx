"use client";

import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import { resolveArticleImage, IMAGE_TAG_PATTERN } from "@/lib/article-images";

function allowInternalSchemes(url: string): string {
  if (url.startsWith("IMAGE:") || url.startsWith("cta:")) return url;
  return defaultUrlTransform(url);
}

/** ## 見出しの直後に IMAGE: タグがなければ自動挿入する */
function injectImages(content: string): string {
  const lines = content.split("\n");
  const result: string[] = [];
  let imgIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    result.push(lines[i]);

    if (/^## /.test(lines[i])) {
      // 見出し直後の空行をスキップして次の実コンテンツ行を確認
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === "") j++;

      const nextLine = lines[j] ?? "";
      const hasImage = /!\[.*?\]\(IMAGE:/.test(nextLine);

      if (!hasImage) {
        const tags = ["work", "office", "meeting", "hiring", "team", "document"];
        const tag = tags[imgIndex % tags.length];
        result.push(`\n![](IMAGE:${tag})`);
        imgIndex++;
      }
    }
  }

  return result.join("\n");
}

export default function ArticleBody({ content }: { content: string }) {
  const processed = injectImages(content);
  let imgIndex = 0;

  return (
    <div className="article-content">
      <ReactMarkdown
        urlTransform={allowInternalSchemes}
        components={{
          img({ src, alt }) {
            const srcStr = typeof src === "string" ? src : undefined;
            if (srcStr && IMAGE_TAG_PATTERN.test(srcStr)) {
              const tag = srcStr.replace("IMAGE:", "").trim().toLowerCase();
              const url = resolveArticleImage(tag, imgIndex++);
              return (
                <span className="article-image-wrap">
                  <img src={url} alt={alt ?? ""} className="article-image" loading="lazy" />
                </span>
              );
            }
            return <img src={srcStr} alt={alt ?? ""} className="article-image" loading="lazy" />;
          },
          a({ href, children }) {
            if (href?.startsWith("cta:")) {
              return (
                <span className="article-inline-cta-wrap">
                  <a href="/#job-form" className="article-inline-cta">
                    {children}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </a>
                </span>
              );
            }
            return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
          },
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}

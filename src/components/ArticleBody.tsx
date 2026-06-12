"use client";

import ReactMarkdown from "react-markdown";
import { resolveArticleImage, IMAGE_TAG_PATTERN } from "@/lib/article-images";

export default function ArticleBody({ content }: { content: string }) {
  let imgIndex = 0;

  return (
    <div className="article-content">
      <ReactMarkdown
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
        {content}
      </ReactMarkdown>
    </div>
  );
}

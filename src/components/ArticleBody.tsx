"use client";

import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import { resolveArticleImage, IMAGE_TAG_PATTERN } from "@/lib/article-images";

interface PexelsPhoto {
  url: string;
  photographer: string;
  photographerUrl: string;
}

function allowInternalSchemes(url: string): string {
  if (url.startsWith("IMAGE:") || url.startsWith("cta:")) return url;
  return defaultUrlTransform(url);
}

function injectImages(content: string): string {
  const lines = content.split("\n");
  const result: string[] = [];
  let imgIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    result.push(lines[i]);

    if (/^## /.test(lines[i])) {
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

function parseImagePool(imagePool?: string | null): PexelsPhoto[] {
  if (!imagePool) return [];
  try {
    return JSON.parse(imagePool) as PexelsPhoto[];
  } catch {
    return [];
  }
}

export default function ArticleBody({
  content,
  imagePool,
}: {
  content: string;
  imagePool?: string | null;
}) {
  const processed = injectImages(content);
  const pool = parseImagePool(imagePool);
  let imgIndex = 0;

  return (
    <div className="article-content">
      <ReactMarkdown
        urlTransform={allowInternalSchemes}
        components={{
          img({ src, alt }) {
            const srcStr = typeof src === "string" ? src : undefined;
            if (srcStr && IMAGE_TAG_PATTERN.test(srcStr)) {
              const idx = imgIndex++;
              const photo = pool.length > 0 ? pool[idx % pool.length] : null;
              const url = photo
                ? photo.url
                : resolveArticleImage(
                    srcStr.replace("IMAGE:", "").trim().toLowerCase(),
                    idx
                  );
              return (
                <span className="article-image-wrap">
                  <img
                    src={url}
                    alt={alt ?? ""}
                    className="article-image"
                    loading="lazy"
                  />
                  {photo && (
                    <span className="article-image-credit">
                      Photo by{" "}
                      <a
                        href={photo.photographerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {photo.photographer}
                      </a>{" "}
                      on{" "}
                      <a
                        href="https://www.pexels.com"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Pexels
                      </a>
                    </span>
                  )}
                </span>
              );
            }
            return (
              <img
                src={srcStr}
                alt={alt ?? ""}
                className="article-image"
                loading="lazy"
              />
            );
          },
          a({ href, children }) {
            if (href?.startsWith("cta:")) {
              const handleCtaClick = () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (window as any).gtag?.("event", "cta_click", {
                  event_category: "article_inline",
                  event_label: "inline_cta",
                });
              };
              return (
                <span className="article-inline-cta-wrap">
                  <a
                    href="/#job-form"
                    className="article-inline-cta"
                    onClick={handleCtaClick}
                  >
                    {children}
                    <svg
                      width="14"
                      height="14"
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
                  </a>
                </span>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}

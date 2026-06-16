import { prisma } from "@/lib/prisma";
import { generateSeoArticle, suggestArticleKeywords } from "@/lib/gemini";
import { ARTICLE_KEYWORDS } from "@/lib/article-keywords";
import { fetchPexelsImage } from "@/lib/pexels";

export type KeywordRow = {
  slug: string;
  keyword: string;
  titleHint: string;
  source: "SEED" | "AI" | "MANUAL";
  status: "pending" | "published" | "failed";
  title?: string;
  error?: string;
};

/** 既存記事・シード定義をキーワードキューに同期 */
export async function syncKeywordQueue() {
  const publishedSlugs = new Set(
    (await prisma.article.findMany({ select: { slug: true } })).map((a) => a.slug),
  );

  for (const entry of ARTICLE_KEYWORDS) {
    const status = publishedSlugs.has(entry.slug) ? "GENERATED" : "PENDING";
    await prisma.articleKeyword.upsert({
      where: { slug: entry.slug },
      create: {
        slug: entry.slug,
        keyword: entry.keyword,
        titleHint: entry.titleHint,
        source: "SEED",
        status,
      },
      update: {
        keyword: entry.keyword,
        titleHint: entry.titleHint,
        ...(publishedSlugs.has(entry.slug) ? { status: "GENERATED", error: null } : {}),
      },
    });
  }

  const articles = await prisma.article.findMany({
    select: { slug: true, keyword: true, title: true },
  });
  for (const article of articles) {
    await prisma.articleKeyword.upsert({
      where: { slug: article.slug },
      create: {
        slug: article.slug,
        keyword: article.keyword,
        titleHint: article.title,
        source: "SEED",
        status: "GENERATED",
      },
      update: { status: "GENERATED", error: null },
    });
  }
}

async function getTakenKeywords(): Promise<string[]> {
  const [fromQueue, fromArticles] = await Promise.all([
    prisma.articleKeyword.findMany({ select: { keyword: true, slug: true } }),
    prisma.article.findMany({ select: { keyword: true, slug: true } }),
  ]);
  const set = new Set<string>();
  for (const row of [...fromQueue, ...fromArticles]) {
    set.add(row.keyword.toLowerCase());
    set.add(row.slug.toLowerCase());
  }
  return [...set];
}

function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** AI が新キーワードを提案してキューに追加 */
export async function suggestAndQueueKeywords(count = 3): Promise<string[]> {
  const taken = await getTakenKeywords();
  const existingKeywords = (
    await prisma.articleKeyword.findMany({
      select: { keyword: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    })
  ).map((k) => k.keyword);

  const ideas = await suggestArticleKeywords({
    count,
    existingKeywords,
    takenSlugs: taken,
  });

  const added: string[] = [];
  for (const idea of ideas) {
    const slug = normalizeSlug(idea.slug);
    if (!slug || taken.includes(slug) || taken.includes(idea.keyword.toLowerCase())) {
      continue;
    }

    const exists =
      (await prisma.articleKeyword.findUnique({ where: { slug } })) ??
      (await prisma.article.findUnique({ where: { slug } }));
    if (exists) continue;

    await prisma.articleKeyword.create({
      data: {
        slug,
        keyword: idea.keyword,
        titleHint: idea.titleHint,
        source: "AI",
        status: "PENDING",
      },
    });
    taken.push(slug);
    taken.push(idea.keyword.toLowerCase());
    added.push(slug);
  }

  return added;
}

/** 未生成キューが target 件になるまで AI でキーワードを補充 */
export async function ensureKeywordQueue(targetSize: number): Promise<string[]> {
  await syncKeywordQueue();
  const allAdded: string[] = [];

  for (let attempt = 0; attempt < 5; attempt++) {
    const pending = await prisma.articleKeyword.count({
      where: { status: { in: ["PENDING", "FAILED"] } },
    });
    if (pending >= targetSize) break;

    const need = Math.min(targetSize - pending, 10);
    const added = await suggestAndQueueKeywords(need);
    allAdded.push(...added);
    if (added.length === 0) break;
  }

  return allAdded;
}

function envInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export function getArticlePipelineConfig() {
  return {
    minQueueSize: envInt("ARTICLE_MIN_QUEUE_SIZE", 10),
    suggestCount: envInt("ARTICLE_AUTO_SUGGEST_COUNT", 5),
    cronMaxGenerate: envInt("ARTICLE_CRON_MAX_GENERATE", 3),
    adminMaxGenerate: envInt("ARTICLE_ADMIN_MAX_GENERATE", 15),
  };
}

/** 指定スラッグの記事を1件生成 */
export async function generateArticleBySlug(slug: string) {
  const entry = await prisma.articleKeyword.findUnique({ where: { slug } });
  if (!entry) {
    throw new Error("キーワードが見つかりません");
  }

  const existingArticle = await prisma.article.findUnique({ where: { slug } });
  if (existingArticle) {
    await prisma.articleKeyword.update({
      where: { slug },
      data: { status: "GENERATED", error: null },
    });
    return { slug, keyword: entry.keyword, alreadyPublished: true };
  }

  try {
    const { title, metaDescription, content } = await generateSeoArticle(
      entry.keyword,
      entry.titleHint,
    );
    const coverImage = await fetchPexelsImage(entry.keyword).catch(() => null);
    await prisma.article.create({
      data: {
        slug: entry.slug,
        keyword: entry.keyword,
        title,
        metaDescription,
        content,
        ...(coverImage ? { coverImage } : {}),
      },
    });
    await prisma.articleKeyword.update({
      where: { slug },
      data: { status: "GENERATED", error: null },
    });
    return { slug, keyword: entry.keyword, alreadyPublished: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.articleKeyword.update({
      where: { slug },
      data: { status: "FAILED", error: message },
    });
    throw err;
  }
}

/** キュー先頭の未生成キーワードを1件生成 */
export async function generateNextPendingArticle() {
  const next = await prisma.articleKeyword.findFirst({
    where: { status: { in: ["PENDING", "FAILED"] } },
    orderBy: { createdAt: "asc" },
  });
  if (!next) return null;
  return generateArticleBySlug(next.slug);
}

export async function listKeywordRows(): Promise<KeywordRow[]> {
  await syncKeywordQueue();

  const [keywords, articles] = await Promise.all([
    prisma.articleKeyword.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.article.findMany({ select: { slug: true, title: true } }),
  ]);
  const articleBySlug = new Map(articles.map((a) => [a.slug, a]));

  return keywords.map((k) => {
    const article = articleBySlug.get(k.slug);
    let status: KeywordRow["status"] = "pending";
    if (article || k.status === "GENERATED") status = "published";
    else if (k.status === "FAILED") status = "failed";

    return {
      slug: k.slug,
      keyword: k.keyword,
      titleHint: k.titleHint,
      source: k.source,
      status,
      title: article?.title,
      error: k.error ?? undefined,
    };
  });
}

/** 未生成が足りなければ AI 提案 → 未生成を順次生成 */
export async function runAutoArticlePipeline(options?: {
  minQueueSize?: number;
  suggestCount?: number;
  maxGenerate?: number;
}) {
  const defaults = getArticlePipelineConfig();
  const minQueueSize = options?.minQueueSize ?? defaults.minQueueSize;
  const maxGenerate = options?.maxGenerate ?? defaults.cronMaxGenerate;

  await syncKeywordQueue();

  const suggested = await ensureKeywordQueue(minQueueSize);

  const generated: string[] = [];
  for (let i = 0; i < maxGenerate; i++) {
    const result = await generateNextPendingArticle();
    if (!result) break;
    if (!result.alreadyPublished) generated.push(result.slug);
  }

  const remaining = await prisma.articleKeyword.count({
    where: { status: { in: ["PENDING", "FAILED"] } },
  });

  return { suggested, generated, remaining };
}

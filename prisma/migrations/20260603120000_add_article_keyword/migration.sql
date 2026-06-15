-- CreateEnum
CREATE TYPE "ArticleKeywordSource" AS ENUM ('SEED', 'AI', 'MANUAL');

-- CreateEnum
CREATE TYPE "ArticleKeywordStatus" AS ENUM ('PENDING', 'GENERATED', 'FAILED');

-- CreateTable
CREATE TABLE "ArticleKeyword" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "titleHint" TEXT NOT NULL,
    "source" "ArticleKeywordSource" NOT NULL DEFAULT 'AI',
    "status" "ArticleKeywordStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArticleKeyword_slug_key" ON "ArticleKeyword"("slug");

-- CreateIndex
CREATE INDEX "ArticleKeyword_status_idx" ON "ArticleKeyword"("status");

-- CreateIndex
CREATE INDEX "ArticleKeyword_createdAt_idx" ON "ArticleKeyword"("createdAt");

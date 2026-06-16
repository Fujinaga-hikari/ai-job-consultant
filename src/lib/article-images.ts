/**
 * 記事内画像の管理
 *
 * Gemini が生成した ![説明](IMAGE:タグ) を実際の画像URLに変換する。
 * LOCAL_POOL に画像があればタグに関係なくそこからローテーション。
 * 空の場合は Unsplash にフォールバック（タグで分類）。
 *
 * 画像を追加するには:
 *   public/images/articles/ にファイルを置いて LOCAL_POOL にパスを追記するだけ。
 */

export const LOCAL_POOL: string[] = [
  "/images/articles/pixta_117916914_S.jpg",
  "/images/articles/pixta_120396928_S.jpg",
  "/images/articles/pixta_125544925_S.jpg",
  "/images/articles/pixta_130400523_S.jpg",
  "/images/articles/%E3%81%AA%E3%82%84%E3%81%BE%E3%81%97%E3%81%84.jpg",
  "/images/articles/%E3%81%B2%E3%82%89%E3%82%81%E3%81%8D.jpg",
  "/images/articles/%E6%82%A9%E3%81%BE%E3%81%97%E3%81%84.jpg",
];

const UNSPLASH_FALLBACK: Record<string, string[]> = {
  office: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=70",
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&auto=format&fit=crop&q=70",
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=70",
  ],
  meeting: [
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&auto=format&fit=crop&q=70",
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=70",
    "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop&q=70",
  ],
  hiring: [
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=70",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=70",
    "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=70",
  ],
  team: [
    "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&auto=format&fit=crop&q=70",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=70",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=70",
  ],
  document: [
    "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&auto=format&fit=crop&q=70",
    "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&auto=format&fit=crop&q=70",
    "https://images.unsplash.com/photo-1586282391129-76a6df230234?w=800&auto=format&fit=crop&q=70",
  ],
  work: [
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=70",
    "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&auto=format&fit=crop&q=70",
    "https://images.unsplash.com/photo-1553484771-371a605b060b?w=800&auto=format&fit=crop&q=70",
  ],
};

export function resolveArticleImage(tag: string, index: number): string {
  if (LOCAL_POOL.length > 0) {
    return LOCAL_POOL[index % LOCAL_POOL.length];
  }
  const fallback = UNSPLASH_FALLBACK[tag] ?? UNSPLASH_FALLBACK.office;
  return fallback[index % fallback.length];
}

export const IMAGE_TAG_PATTERN = /^IMAGE:/;

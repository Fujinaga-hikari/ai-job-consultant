const PEXELS_API = "https://api.pexels.com/v1/search";

export interface PexelsPhoto {
  url: string;
  photographer: string;
  photographerUrl: string;
}

/**
 * キーワードで Pexels を検索して PexelsPhoto[] を返す。
 * APIキー未設定・失敗時は空配列。
 */
export async function fetchPexelsPhotos(
  keyword: string,
  count = 5
): Promise<PexelsPhoto[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];

  const query = buildQuery(keyword);
  // キーワードのハッシュでページをずらし、記事ごとに異なる写真セットを取得する
  const hash = kwHash(keyword);
  const page = (hash % 8) + 1; // page 1〜8 をローテーション

  const tryFetch = async (p: number) => {
    const res = await fetch(
      `${PEXELS_API}?query=${encodeURIComponent(query)}&per_page=${count}&page=${p}&orientation=landscape`,
      { headers: { Authorization: key } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      photos: Array<{
        src: { landscape: string };
        photographer: string;
        photographer_url: string;
      }>;
    };
    if (!data.photos || data.photos.length === 0) return null;
    return data.photos.map((ph) => ({
      url: ph.src.landscape,
      photographer: ph.photographer,
      photographerUrl: ph.photographer_url,
    }));
  };

  try {
    // まずハッシュページで試し、空なら page=1 にフォールバック
    const photos = (await tryFetch(page)) ?? (page !== 1 ? await tryFetch(1) : null);
    return photos ?? [];
  } catch {
    return [];
  }
}

/** keyword のハッシュ値（カバー選択・ページ決定に使う） */
export function kwHash(keyword: string): number {
  return [...keyword].reduce((h, c) => (h * 31 + c.charCodeAt(0)) & 0x7fffffff, 0);
}

/** photos[] からキーワードハッシュで1枚選ぶ */
export function pickCover(keyword: string, photos: PexelsPhoto[]): string {
  return photos[kwHash(keyword) % photos.length].url;
}

function buildQuery(keyword: string): string {
  const jpToEn: [RegExp, string][] = [
    [/面接/, "job interview office"],
    [/採用|求人/, "hiring recruitment office Japan"],
    [/オフィス|職場/, "office workplace Japan"],
    [/チーム|組織/, "business team meeting"],
    [/書き方|テンプレート/, "business document writing"],
    [/転職|キャリア/, "career job change"],
    [/人事|HR/, "HR human resources"],
  ];
  for (const [pattern, en] of jpToEn) {
    if (pattern.test(keyword)) return en;
  }
  return "business office Japan recruitment";
}

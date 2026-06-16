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

  try {
    const res = await fetch(
      `${PEXELS_API}?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
      { headers: { Authorization: key } }
    );
    if (!res.ok) return [];

    const data = (await res.json()) as {
      photos: Array<{
        src: { landscape: string };
        photographer: string;
        photographer_url: string;
      }>;
    };
    if (!data.photos || data.photos.length === 0) return [];

    return data.photos.map((p) => ({
      url: p.src.landscape,
      photographer: p.photographer,
      photographerUrl: p.photographer_url,
    }));
  } catch {
    return [];
  }
}

/** 後方互換：coverImage 用に1枚だけ返す */
export async function fetchPexelsImage(keyword: string): Promise<string | null> {
  const photos = await fetchPexelsPhotos(keyword, 5);
  if (photos.length === 0) return null;
  const hash = [...keyword].reduce(
    (h, c) => (h * 31 + c.charCodeAt(0)) & 0x7fffffff,
    0
  );
  return photos[hash % photos.length].url;
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

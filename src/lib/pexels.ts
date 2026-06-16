const PEXELS_API = "https://api.pexels.com/v1/search";

/**
 * キーワードで Pexels を検索して横長画像URLを返す。
 * APIキーが未設定または失敗時は null。
 * 同じキーワードは常に同じ画像を返す（hash でインデックス固定）。
 */
export async function fetchPexelsImage(keyword: string): Promise<string | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;

  // 日本語キーワードをそのまま送る（Pexelsは28言語対応）
  // 採用系ワードは "recruitment office japan" 系で補強
  const query = buildQuery(keyword);

  try {
    const res = await fetch(
      `${PEXELS_API}?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
      {
        headers: { Authorization: key },
        next: { revalidate: 86400 }, // 24h cache
      }
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      photos: Array<{ src: { landscape: string } }>;
    };
    if (!data.photos || data.photos.length === 0) return null;

    // keyword のハッシュで毎回同じ写真を選ぶ（再生成しても同じ画像）
    const hash = [...keyword].reduce((h, c) => (h * 31 + c.charCodeAt(0)) & 0x7fffffff, 0);
    return data.photos[hash % data.photos.length].src.landscape;
  } catch {
    return null;
  }
}

function buildQuery(keyword: string): string {
  // 日本語キーワードから英語補足ワードを追加して検索精度を上げる
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

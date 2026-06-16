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

/** キーワードごとに視覚的に異なる写真が出るよう多様なクエリを返す */
function buildQuery(keyword: string): string {
  // キーワード固有のマッチ
  if (/面接/.test(keyword)) return "job interview candidate professional";
  if (/書き方|テンプレート|フォーマット/.test(keyword)) return "document writing business desk pen";
  if (/転職|キャリア/.test(keyword)) return "career success professional growth";
  if (/人事|HR/.test(keyword)) return "human resources management team";
  if (/オフィス|職場/.test(keyword)) return "modern office interior workspace";
  if (/チーム|組織|会社/.test(keyword)) return "business team collaboration office";
  if (/給与|年収|賃金/.test(keyword)) return "salary finance business professional";
  if (/研修|教育|育成/.test(keyword)) return "corporate training workshop seminar";
  if (/パート|アルバイト/.test(keyword)) return "part time job casual work cafe";
  if (/派遣|フリーランス/.test(keyword)) return "freelance remote work laptop";
  if (/営業|セールス/.test(keyword)) return "sales business meeting client";
  if (/エンジニア|IT|システム/.test(keyword)) return "software developer coding computer";
  if (/医療|介護|看護/.test(keyword)) return "healthcare medical professional hospital";
  if (/飲食|レストラン|料理/.test(keyword)) return "restaurant kitchen chef food";
  if (/小売|販売|店舗/.test(keyword)) return "retail store sales assistant";

  // 採用・求人系はハッシュで多様なクエリをローテーション
  const recruitmentQueries = [
    "hiring manager interviewing candidate office",
    "job offer handshake agreement business",
    "recruitment process company employees smiling",
    "professional woman executive boardroom",
    "diverse team working together corporate",
    "office building entrance lobby professional",
    "employee onboarding orientation welcome",
    "business presentation whiteboard team",
    "laptop documents desk professional working",
    "networking business cards career event",
    "corporate culture open office modern",
    "job fair career expo professionals",
  ];
  return recruitmentQueries[kwHash(keyword) % recruitmentQueries.length];
}

import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseGeminiJson } from "@/lib/parse-gemini-json";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateJobPosting(data: {
  companyName: string;
  jobTitle: string;
  salary?: string;
  location?: string;
  content: string;
  persona?: string;
}): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `あなたは凄腕の採用広報コンサルタントです。
以下の[データ]を元に、求職者が応募したくて堪らなくなるような、魅力溢れる求人記事をMarkdown形式で作成してください。

【ルール】
1. 見出し(###)を必ず使い、記事のテーマを分けてください。
2. 重要なキーワード、メリット、ベネフィットは必ず太字(**)で強調してください。
3. 箇条書きを活用し、読みやすい構成にしてください。
4. 冒頭にキャッチコピーを入れてください。

[データ]
企業名: ${data.companyName}
職種: ${data.jobTitle}
業務内容: ${data.content}
${data.persona ? `人物像: ${data.persona}` : ""}
${data.salary ? `給与: ${data.salary}` : ""}
${data.location ? `勤務地: ${data.location}` : ""}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

export async function generateSeoArticle(keyword: string, titleHint: string): Promise<{
  title: string;
  metaDescription: string;
  content: string;
}> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `あなたはSEOと採用に精通したコンテンツライターです。
以下の指示に従い、採用担当者向けのSEO記事をJSON形式で出力してください。

【ターゲットキーワード】
${keyword}

【記事タイトルのヒント】
${titleHint}

【記事の要件】
- 文字数: 1,500〜2,000字
- 対象読者: 中小〜中堅企業の採用担当者
- 構成: 導入 → 課題提示 → 解決策（見出しH2・H3で整理）→ まとめ
- ターゲットキーワードを自然に5〜8回使用
- 具体的な例文・テンプレートを必ず含める
- 最後に「AIを使えば求人票作成の時間を大幅に削減できる」という自然な締めを入れる
- Markdown形式（## H2, ### H3, **太字**, - 箇条書き）

【必須: 画像プレースホルダー（2〜3枚）】
各H2見出しの直後に必ず1枚ずつ画像プレースホルダーを挿入すること。
書式: ![画像の説明テキスト](IMAGE:タグ)
使用できるタグ: office / meeting / hiring / team / document / work
例:
## 求人票の書き方の基本
![採用担当者がパソコンで求人票を作成している](IMAGE:work)
本文...

【必須: 無料AI求人生成への誘導リンク（1〜2箇所）】
課題説明の後・解決策の前など、読者が「試したい」と感じるタイミングに必ず挿入すること。
書式: [AIですぐに求人を作ってみる！](cta:inline)
例:
求人票の作成に悩んでいる方は、まずAIで下書きを作ってみましょう。

[AIですぐに求人を作ってみる！](cta:inline)

下書きができたら、以下のポイントを参考に...

【必須: FAQセクション（記事末尾）】
記事の最後に必ず以下の形式でFAQセクションを追加すること（3問以上）:

## よくある質問

### Q: [採用担当者がよく検索するであろう具体的な質問]
A: [100字以内の簡潔な回答]

### Q: [別の質問]
A: [100字以内の簡潔な回答]

### Q: [3つ目の質問]
A: [100字以内の簡潔な回答]

【出力形式】
必ず以下のJSONのみを出力してください（マークダウンコードブロック不要）。
content 内の改行は必ず \\n でエスケープし、JSONとして有効な1行の文字列にしてください:
{
  "title": "記事タイトル（40文字以内、キーワードを含む）",
  "metaDescription": "メタディスクリプション（120文字以内、キーワードを含む）",
  "content": "Markdown形式の記事本文（改行は\\\\n）"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const parsed = parseGeminiJson<{
    title: string;
    metaDescription: string;
    content: string;
  }>(text);

  return {
    title: parsed.title,
    metaDescription: parsed.metaDescription,
    content: parsed.content.replace(/\\n/g, "\n"),
  };
}

export type SuggestedKeyword = {
  keyword: string;
  titleHint: string;
  slug: string;
};

export async function suggestArticleKeywords(data: {
  count: number;
  existingKeywords: string[];
  takenSlugs: string[];
}): Promise<SuggestedKeyword[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `あなたは採用・求人領域のSEOストラテジストです。
MixJob（AI求人ドラフト生成LP）のブログ向けに、検索されやすくCVに繋がるキーワードを提案してください。

【サービス概要】
- 採用担当者がAIで求人票・求人原稿を素早く作れる無料ツール
- ターゲット: 中小〜中堅企業の採用担当・人事

【既にカバー済みのキーワード（重複禁止）】
${data.existingKeywords.length > 0 ? data.existingKeywords.join("\n") : "（なし）"}

【使用済みスラッグ（重複禁止）】
${data.takenSlugs.slice(0, 50).join("\n")}

【要件】
- ${data.count}件提案
- 各キーワードは2〜5語の日本語（検索意図が明確）
- 職種別・課題別・HowTo系をバランスよく
- 求人票/求人原稿/採用/リクルーティング周辺に限定
- slug は英小文字とハイフンのみ（例: nurse-kyujinhyo-kakikata）
- titleHint は40文字以内の記事タイトル案

【出力】JSONのみ（コードブロック不要）:
{
  "keywords": [
    { "keyword": "...", "titleHint": "...", "slug": "..." }
  ]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const parsed = parseGeminiJson<{ keywords: SuggestedKeyword[] }>(text);
  return Array.isArray(parsed.keywords) ? parsed.keywords : [];
}

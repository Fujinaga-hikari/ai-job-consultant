import { GoogleGenerativeAI } from "@google/generative-ai";

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
- 記事内の適切な位置（H2見出しの直後など）に2〜3枚の画像プレースホルダーを挿入する
  - 書式: ![画像の説明テキスト](IMAGE:タグ)
  - タグは以下のいずれかを使用: office, meeting, hiring, team, document, work
  - 例: ![採用担当者がパソコンで求人票を作成している](IMAGE:work)
- 記事の内容の流れが自然に途切れる箇所（課題説明の後、解決策の紹介直前など）に1〜2箇所、行動喚起リンクを挿入する
  - 書式: [AIですぐに求人を作ってみる！](cta:inline)
  - 前後の文脈と齟齬が出ないよう、読者が「試してみたい」と思うタイミングに置くこと

【出力形式】
必ず以下のJSONのみを出力してください（マークダウンコードブロック不要）:
{
  "title": "記事タイトル（40文字以内、キーワードを含む）",
  "metaDescription": "メタディスクリプション（120文字以内、キーワードを含む）",
  "content": "Markdown形式の記事本文"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // JSONブロックを除去してパース
  const jsonText = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  const parsed = JSON.parse(jsonText);

  return {
    title: parsed.title as string,
    metaDescription: parsed.metaDescription as string,
    content: parsed.content as string,
  };
}

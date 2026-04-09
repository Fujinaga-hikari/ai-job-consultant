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

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  fetchWeeklyReportMetrics,
  metricsToPromptJson,
  type WeeklyReportMetrics,
} from "@/lib/metrics/weekly";
import { sendWeeklyReportEmail } from "@/lib/email";

const REPORT_PROMPT = `あなたは採用LP（AI求人ドラフト生成→無料相談CV）のグロース担当です。
以下のJSONは直近週のDB計測です（GAは含みません）。日本語で週次レポートを作成してください。

【必須セクション】（見出しは ### で）
### 今週のサマリー
- 期間・PV/UU・生成数・問い合わせ数・CV率（問い合わせ/生成）を箇条書き
- 前週比（changes）があれば簡潔に

### 気づき（最大3つ）
- 数字に基づく洞察のみ。推測は「仮説」と明記

### 提案アクション（最大5件）
各項目を次の形式で：
- **[A|B|C|D] タイトル** — 根拠 / 想定工数
  - A: エージェント（Cursor）がコード・文言・計測を実装可能（あなたのOK後）
  - B: オーナーのビジネス判断が必要（予算・優先度など）
  - C: オーナーがコード外で作業（DNS・広告アカウント・Brevo認証など）
  - D: データ不足のため保留推奨

### 今週の確認（返信例: 1はい / 2いいえ / 3保留）
- 上記アクションを番号付きで再掲。実行可否をオーナーに問いかける一文を末尾に

【制約】
- 誇大表現禁止。データが少ない場合は「サンプル不足」と書く
- eightWeekTrend を参照してトレンドに言及してよい
- サイトURLは metrics.siteUrl

【入力データ】
`;

export async function generateWeeklyReportMarkdown(
  metrics: WeeklyReportMetrics,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(
    REPORT_PROMPT + metricsToPromptJson(metrics),
  );
  const text = result.response.text();
  if (!text?.trim()) {
    throw new Error("Gemini returned empty report");
  }
  return text.trim();
}

export type WeeklyReportResult = {
  metrics: WeeklyReportMetrics;
  markdown: string;
  emailed: boolean;
};

export async function runWeeklyReport(options?: {
  sendEmail?: boolean;
}): Promise<WeeklyReportResult> {
  const metrics = await fetchWeeklyReportMetrics();
  const markdown = await generateWeeklyReportMarkdown(metrics);

  let emailed = false;
  if (options?.sendEmail !== false) {
    emailed =
      (await sendWeeklyReportEmail({
        periodLabel: metrics.periodLabel,
        markdown,
        metrics,
      })) ?? false;
  }

  return { metrics, markdown, emailed };
}

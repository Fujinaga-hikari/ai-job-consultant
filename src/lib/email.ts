const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

function getSender() {
  return { email: process.env.EMAIL_FROM || "noreply@resend.dev" };
}

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string[];
  subject: string;
  html: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY is not set");

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: getSender(),
      to: to.map((email) => ({ email })),
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Brevo API error ${res.status}:`, body);
    throw new Error(`Brevo API error ${res.status}: ${body}`);
  }
}

export async function sendNotificationEmail(data: {
  email: string;
  name?: string;
  companyName?: string;
  phone?: string;
  preferredTime?: string;
}) {
  const raw = process.env.NOTIFY_EMAIL || "";
  const recipients = raw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (recipients.length === 0) return;

  await sendEmail({
    to: recipients,
    subject: `【新規相談申込】${data.name || data.email}様`,
    html: `
      <h2>新しい無料相談のお申し込みがありました</h2>
      <table style="border-collapse:collapse;width:100%;max-width:500px;">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">メール</td><td style="padding:8px;border:1px solid #ddd;">${data.email}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">氏名</td><td style="padding:8px;border:1px solid #ddd;">${data.name || "未入力"}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">会社名</td><td style="padding:8px;border:1px solid #ddd;">${data.companyName || "未入力"}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">電話番号</td><td style="padding:8px;border:1px solid #ddd;">${data.phone || "未入力"}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">希望連絡時間</td><td style="padding:8px;border:1px solid #ddd;">${data.preferredTime || "未入力"}</td></tr>
      </table>
    `,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function markdownToSimpleHtml(md: string): string {
  const lines = md.split("\n");
  const parts: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (trimmed.startsWith("### ")) {
      if (inList) {
        parts.push("</ul>");
        inList = false;
      }
      parts.push(`<h3 style="margin:20px 0 8px;color:#e84730;">${escapeHtml(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith("## ")) {
      if (inList) {
        parts.push("</ul>");
        inList = false;
      }
      parts.push(`<h2 style="margin:24px 0 10px;">${escapeHtml(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith("- ")) {
      if (!inList) {
        parts.push('<ul style="margin:8px 0;padding-left:20px;">');
        inList = true;
      }
      const body = escapeHtml(trimmed.slice(2)).replace(
        /\*\*(.+?)\*\*/g,
        "<strong>$1</strong>",
      );
      parts.push(`<li style="margin:4px 0;">${body}</li>`);
    } else if (trimmed === "") {
      if (inList) {
        parts.push("</ul>");
        inList = false;
      }
    } else {
      if (inList) {
        parts.push("</ul>");
        inList = false;
      }
      const body = escapeHtml(trimmed).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      parts.push(`<p style="margin:8px 0;">${body}</p>`);
    }
  }
  if (inList) parts.push("</ul>");
  return parts.join("\n");
}

function metricsSummaryTable(metrics: {
  periodLabel: string;
  thisWeek: {
    pv: number;
    uu: number;
    generations: number;
    leads: number;
    conversionRate: number;
  };
  changes: {
    pv: number | null;
    uu: number | null;
    generations: number | null;
    leads: number | null;
  };
}): string {
  const fmt = (n: number | null) =>
    n === null ? "—" : `${n > 0 ? "+" : ""}${n}%`;
  const w = metrics.thisWeek;
  return `
    <table style="border-collapse:collapse;width:100%;max-width:520px;margin:16px 0;">
      <tr style="background:#f9fafb;">
        <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">指標</th>
        <th style="padding:8px;border:1px solid #e5e7eb;text-align:right;">今週</th>
        <th style="padding:8px;border:1px solid #e5e7eb;text-align:right;">前週比</th>
      </tr>
      <tr><td style="padding:8px;border:1px solid #e5e7eb;">PV</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${w.pv}</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${fmt(metrics.changes.pv)}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e5e7eb;">UU</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${w.uu}</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${fmt(metrics.changes.uu)}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e5e7eb;">AI生成</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${w.generations}</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${fmt(metrics.changes.generations)}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e5e7eb;">問い合わせ</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${w.leads}</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${fmt(metrics.changes.leads)}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e5e7eb;">CV率</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${w.conversionRate}%</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">—</td></tr>
    </table>
  `;
}

export async function sendWeeklyReportEmail({
  periodLabel,
  markdown,
  metrics,
}: {
  periodLabel: string;
  markdown: string;
  metrics: Parameters<typeof metricsSummaryTable>[0];
}) {
  const raw =
    process.env.WEEKLY_REPORT_EMAIL || process.env.NOTIFY_EMAIL || "";
  const recipients = raw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (recipients.length === 0) {
    console.warn("WEEKLY_REPORT_EMAIL / NOTIFY_EMAIL not set; skipping weekly email");
    return false;
  }

  await sendEmail({
    to: recipients,
    subject: `【MixJob LP】週次レポート ${periodLabel}`,
    html: `
      <div style="max-width:640px;margin:0 auto;font-family:sans-serif;color:#1f2937;line-height:1.6;">
        <h1 style="font-size:20px;color:#e84730;">週次レポート</h1>
        <p style="color:#6b7280;">対象期間: ${escapeHtml(periodLabel)}（JST・DB計測）</p>
        ${metricsSummaryTable(metrics)}
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        ${markdownToSimpleHtml(markdown)}
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="font-size:13px;color:#6b7280;">
          返信例: <code>1はい / 2いいえ / 3保留</code><br />
          [A] の項目は Cursor で実装可能です。承認後に作業を進めてください。
        </p>
      </div>
    `,
  });
  return true;
}

export async function sendAutoReplyEmail(email: string, name?: string) {
  await sendEmail({
    to: [email],
    subject: "【MixJob】無料相談のお申し込みありがとうございます",
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:sans-serif;">
        <h2 style="color:#e63946;">${name ? `${name}様` : "お客様"}</h2>
        <p>この度は無料相談にお申し込みいただき、誠にありがとうございます。</p>
        <p>担当コンサルタントより<strong>最短即日</strong>でご連絡させていただきます。</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="font-size:0.85em;color:#888;">
          MIXJOB運営<br />
          電話番号：03-6689-0593<br />
          営業時間：平日9:00〜19:00<br />
          運営元：株式会社HNCommunications<br /><br />
          本メールは自動送信です。
        </p>
      </div>
    `,
  });
}

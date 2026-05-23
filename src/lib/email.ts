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
        <p style="font-size:0.85em;color:#888;">本メールは自動送信です。MixJob</p>
      </div>
    `,
  });
}

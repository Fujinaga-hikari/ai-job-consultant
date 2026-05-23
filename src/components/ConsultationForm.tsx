"use client";

import { useState } from "react";

type Props = {
  logId: string;
  onBack: () => void;
};

export default function ConsultationForm({ logId, onBack }: Props) {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!agreed) return;
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fd.get("email"),
          name: fd.get("name"),
          companyName: fd.get("companyName"),
          phone: fd.get("phone"),
          preferredTime: fd.get("preferredTime"),
          agreed: true,
          generationLogId: logId,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(typeof json.error === "string" ? json.error : "送信に失敗しました");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <section className="consult-section">
        <div className="submit-success">
          <div className="success-msg">
            リクエストを承りました！担当コンサルタントより最短即日でご連絡いたします。
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="consult-section">
      {/* Decorative background mark */}
      <div style={{ position: "absolute", right: -80, bottom: -80, opacity: .05, pointerEvents: "none" }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 176 170" width={420} height={420}>
          <path fill="#e84730" d="M133.34 15.35c1.69 2.25 2.96 4.37 3.86 6.34.88 1.98 1.69 3.85 2.45 5.64 1.16 3.52 1.2 6.71.11 9.57-1.09 2.86-2.76 5.13-5.01 6.81-3.38 2.52-7.31 3.54-11.75 3.06-4.46-.48-7.76-3.14-9.9-7.97-.75-1.78-1.54-3.24-2.38-4.37-3.5-4.7-8.64-4.52-15.41.52l-36.31 27.08c-3.01 2.24-6.47 2.99-10.38 2.26-3.91-.74-7.28-2.98-10.08-6.74-2.8-3.76-3.93-7.52-3.38-11.3.55-3.77 2.42-6.85 5.62-9.23l36.59-27.3C87.13 2.42 97.2-.76 107.53.15c10.34.92 18.95 5.99 25.81 15.19z" />
          <path fill="#e84730" d="M28.73 73.02c3.48 3.48 5.35 7.59 5.6 12.32.25 4.72-1.37 8.83-4.85 12.31-3.15 3.15-7.13 4.64-11.94 4.48-4.81-.17-8.95-1.99-12.44-5.47C1.78 93.34.08 89.31 0 84.59c-.08-4.73 1.45-8.67 4.6-11.81 3.48-3.48 7.54-5.14 12.19-4.97 4.64.17 8.62 1.91 11.94 5.21z" />
          <path fill="#e84730" d="M42.45 154.58c-1.68-2.25-2.96-4.37-3.85-6.34-.88-1.98-1.7-3.85-2.45-5.64-1.16-3.52-1.2-6.71-.11-9.57 1.09-2.86 2.76-5.13 5.01-6.81 3.38-2.52 7.3-3.54 11.75-3.06 4.46.48 7.76 3.14 9.9 7.97.75 1.79 1.54 3.24 2.38 4.37 3.5 4.7 8.64 4.52 15.41-.52l36.31-27.08c3-2.24 6.46-2.99 10.38-2.26 3.91.74 7.27 2.98 10.08 6.74 2.8 3.76 3.93 7.53 3.38 11.3-.55 3.77-2.42 6.85-5.62 9.23l-36.59 27.3c-9.77 7.28-19.84 10.47-30.17 9.56-10.34-.92-18.95-5.99-25.82-15.19z" />
          <path fill="#e84730" d="M147.07 96.9c-3.48-3.48-5.35-7.59-5.6-12.31-.25-4.72 1.37-8.83 4.85-12.31 3.15-3.15 7.13-4.64 11.94-4.48 4.81.17 8.96 1.99 12.44 5.47 3.32 3.31 5.02 7.34 5.1 12.06.08 4.73-1.45 8.67-4.6 11.81-3.48 3.48-7.55 5.14-12.19 4.97-4.64-.17-8.62-1.91-11.94-5.21z" />
        </svg>
      </div>

      <div className="consult-hero" style={{ position: "relative", zIndex: 2 }}>
        {/* Left: Features */}
        <div className="consult-left">
          <div className="section-eyebrow">NEXT STEP</div>
          <h2>
            この原稿を、<br />
            <span className="accent">採用成功</span>まで伴走します
          </h2>
          <p className="lede">
            AI 生成だけでは、まだスタート地点。MixJob では、現役の採用コンサルタントが、原稿の磨き込みから媒体運用、面接設計まで「採用が決まる」まで完全無料で伴走します。
          </p>
          <div className="feature-list">
            <div className="feature">
              <div className="ic">01</div>
              <div>
                <h5>原稿の磨き込み無料</h5>
                <p>生成された原稿を、業界に精通したコンサルが追加で添削。「採れる原稿」へさらに磨きます。</p>
              </div>
            </div>
            <div className="feature">
              <div className="ic">02</div>
              <div>
                <h5>媒体選定とコスト最適化</h5>
                <p>30 以上の求人媒体から、貴社にもっとも適した媒体を提案。広告費を平均 32% 削減した実績あり。</p>
              </div>
            </div>
            <div className="feature">
              <div className="ic">03</div>
              <div>
                <h5>面接設計まで完全サポート</h5>
                <p>応募者のスクリーニング基準・面接質問の設計まで。「採用ミスマッチ」を構造的に防ぎます。</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="consult-form-card">
          <div className="top">
            <div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".1em", color: "var(--brand-red)", fontWeight: 700 }}>
                STEP 02 OF 02 — CONSULT
              </span>
              <h3 style={{ margin: "4px 0 0" }}>プロのコンサルタントに相談</h3>
            </div>
            <span className="free-badge">完全無料</span>
          </div>

          <div className="consultant-row">
            <div className="avatars">
              <div className="avatar a1" />
              <div className="avatar a2" />
              <div className="avatar a3" />
            </div>
            <div className="text">
              <strong>専任コンサルタントが担当します</strong>
              <span className="availability">● 現在対応可能</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid" style={{ gap: 16, marginBottom: 16 }}>
              <div className="field col-span-2">
                <label>メールアドレス <span className="req">必須</span></label>
                <input className="input" type="email" name="email" placeholder="your@company.co.jp" required />
              </div>
              <div className="field">
                <label>お名前 <span className="opt">任意</span></label>
                <input className="input" type="text" name="name" placeholder="山田 太郎" />
              </div>
              <div className="field">
                <label>会社名 <span className="opt">任意</span></label>
                <input className="input" type="text" name="companyName" placeholder="株式会社○○" />
              </div>
              <div className="field col-span-2">
                <label>電話番号 <span className="req">必須</span></label>
                <input className="input" type="tel" name="phone" placeholder="例: 03-1234-5678" required />
              </div>
              <div className="field col-span-2">
                <label>ご希望の連絡時間帯 <span className="opt">任意</span></label>
                <input className="input" type="text" name="preferredTime" placeholder="例: 平日10:00〜18:00" />
              </div>
            </div>

            <label className="checkbox-row">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span>
                <a href="https://mixjob.co.jp/privacy/" target="_blank" rel="noopener noreferrer">プライバシーポリシー</a>
                {" "}に同意の上、無料相談を申し込みます。
              </span>
            </label>

            {error && <div className="error-box">{error}</div>}

            <button type="submit" className="btn-submit" disabled={!agreed || loading} style={{ marginTop: 12 }}>
              {loading ? "送信中..." : <><span>無料で相談を申し込む</span><span className="arrow">→</span></>}
            </button>

            <div className="submit-meta">
              <span className="meta-item">最短即日返信</span>
              <span className="meta-item">完全無料</span>
              <span className="meta-item">無理な勧誘なし</span>
            </div>
          </form>

          <div className="faq-strip">
            <div className="ic">?</div>
            <div className="copy">
              <strong>無料の範囲はどこまで？</strong>　原稿の磨き込み・媒体提案・初回面談（90分）まで、すべて無料です。媒体運用代行をご依頼いただく場合のみ別途お見積りとなります。
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-back" style={{ position: "relative", zIndex: 2 }}>
        <button onClick={onBack}>← 情報を修正してもう一度生成する</button>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import type { GenerateInput } from "@/lib/validations";
import type { JobMeta } from "@/app/page";

type Props = {
  onGenerated: (result: string, logId: string, meta: JobMeta) => void;
};

export default function JobForm({ onGenerated }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const data: GenerateInput = {
      companyName: fd.get("companyName") as string,
      jobTitle: fd.get("jobTitle") as string,
      salary: fd.get("salary") as string,
      location: fd.get("location") as string,
      content: fd.get("content") as string,
      persona: fd.get("persona") as string,
    };

    if (!data.companyName || !data.jobTitle || !data.content) {
      setError("企業名・職種・業務内容は必須です。");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "生成に失敗しました");
      }
      const json = await res.json();
      onGenerated(json.result, json.logId, {
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        salary: data.salary || "",
        location: data.location || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="hero">
        <div className="dotgrid" />

        {/* Decorative mark */}
        <div className="float-mark" style={{ left: -60, top: 180, transform: "rotate(-18deg)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 176 170" width={340} height={340}>
            <path fill="#e84730" d="M133.34 15.35c1.69 2.25 2.96 4.37 3.86 6.34.88 1.98 1.69 3.85 2.45 5.64 1.16 3.52 1.2 6.71.11 9.57-1.09 2.86-2.76 5.13-5.01 6.81-3.38 2.52-7.31 3.54-11.75 3.06-4.46-.48-7.76-3.14-9.9-7.97-.75-1.78-1.54-3.24-2.38-4.37-3.5-4.7-8.64-4.52-15.41.52l-36.31 27.08c-3.01 2.24-6.47 2.99-10.38 2.26-3.91-.74-7.28-2.98-10.08-6.74-2.8-3.76-3.93-7.52-3.38-11.3.55-3.77 2.42-6.85 5.62-9.23l36.59-27.3C87.13 2.42 97.2-.76 107.53.15c10.34.92 18.95 5.99 25.81 15.19z" />
            <path fill="#e84730" d="M28.73 73.02c3.48 3.48 5.35 7.59 5.6 12.32.25 4.72-1.37 8.83-4.85 12.31-3.15 3.15-7.13 4.64-11.94 4.48-4.81-.17-8.95-1.99-12.44-5.47C1.78 93.34.08 89.31 0 84.59c-.08-4.73 1.45-8.67 4.6-11.81 3.48-3.48 7.54-5.14 12.19-4.97 4.64.17 8.62 1.91 11.94 5.21z" />
            <path fill="#e84730" d="M42.45 154.58c-1.68-2.25-2.96-4.37-3.85-6.34-.88-1.98-1.7-3.85-2.45-5.64-1.16-3.52-1.2-6.71-.11-9.57 1.09-2.86 2.76-5.13 5.01-6.81 3.38-2.52 7.3-3.54 11.75-3.06 4.46.48 7.76 3.14 9.9 7.97.75 1.79 1.54 3.24 2.38 4.37 3.5 4.7 8.64 4.52 15.41-.52l36.31-27.08c3-2.24 6.46-2.99 10.38-2.26 3.91.74 7.27 2.98 10.08 6.74 2.8 3.76 3.93 7.53 3.38 11.3-.55 3.77-2.42 6.85-5.62 9.23l-36.59 27.3c-9.77 7.28-19.84 10.47-30.17 9.56-10.34-.92-18.95-5.99-25.82-15.19z" />
            <path fill="#e84730" d="M147.07 96.9c-3.48-3.48-5.35-7.59-5.6-12.31-.25-4.72 1.37-8.83 4.85-12.31 3.15-3.15 7.13-4.64 11.94-4.48 4.81.17 8.96 1.99 12.44 5.47 3.32 3.31 5.02 7.34 5.1 12.06.08 4.73-1.45 8.67-4.6 11.81-3.48 3.48-7.55 5.14-12.19 4.97-4.64-.17-8.62-1.91-11.94-5.21z" />
          </svg>
        </div>

        <div style={{ position: "relative", zIndex: 2, maxWidth: 680 }}>
          <div className="eyebrow">
            <span className="pulse" />
            AI × 採用のプロが、無料で代筆します
          </div>

          <h1 className="display">
            <span className="underline">魅力的な求人</span>を、<br />
            <span className="accent">3 分</span>で書き上げる。
          </h1>

          <p className="lede">
            項目に答えるだけ。MixJob 独自の採用 AI が、貴社の強みを言語化し、求職者の心に刺さる原稿へと整えます。プロのコンサルタントが監修した「採れる」テンプレートを、誰でも無料で。
          </p>

          <div className="hero-actions">
            <a href="#form" className="btn btn-hero">無料で求人を作成する <span>→</span></a>
          </div>

          <div className="trust-row">
            <div className="item">
              <span className="stars">★★★★★</span>
              <span className="lbl"><span className="mono">4.8</span> / 5.0（利用者評価）</span>
            </div>
            <div className="item">
              <span className="num">1,247<span style={{ fontSize: 14, color: "var(--ink-500)" }}>社</span></span>
              <span className="lbl">累計利用企業</span>
            </div>
            <div className="item">
              <span className="num">47<span style={{ fontSize: 14, color: "var(--ink-500)" }}>秒</span></span>
              <span className="lbl">平均生成時間</span>
            </div>
            <div className="item">
              <span className="num">¥0</span>
              <span className="lbl">利用料金（永久無料）</span>
            </div>
          </div>
        </div>

        {/* Floating preview card */}
        <div className="hero-card">
          <div className="label">LIVE PREVIEW</div>
          <h4>営業マネージャー候補<br />（東京・ハイブリッド）</h4>
          <div className="preview-line w90" />
          <div className="preview-line w70" />
          <div className="preview-line w90" />
          <div className="preview-line w50" />
          <div className="typing" />
          <div className="footer">
            <span>株式会社MixJob</span>
            <span className="ai-badge">AI 生成中</span>
          </div>
        </div>

        <div className="hero-sticker">無料<br />¥0</div>
      </section>

      {/* ── Process ── */}
      <section className="process">
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div className="section-eyebrow">HOW IT WORKS</div>
          <h2 className="section-title">
            フォームに答えるだけ。<br />残りは AI とプロにお任せください。
          </h2>
          <p className="section-sub">求人原稿の作成から採用支援まで、3つのステップ。複雑な手続きは一切ありません。</p>
          <div className="process-grid">
            <div className="step-card">
              <div className="step-num">STEP / 01</div>
              <h3>基本情報を入力</h3>
              <p>企業名・職種・業務内容など6項目を埋めるだけ。所要時間はわずか 3 分です。</p>
              <div className="time"><span>所要時間</span><strong>約 3 分</strong></div>
            </div>
            <div className="step-card featured">
              <div className="step-num">STEP / 02</div>
              <h3>AI が原稿を生成</h3>
              <p>AIと独自の採用ナレッジが融合。1,200社のデータから「採れる」表現を抽出。</p>
              <div className="time"><span>生成時間</span><strong>平均 47 秒</strong></div>
            </div>
            <div className="step-card">
              <div className="step-num">STEP / 03</div>
              <h3>プロに無料相談</h3>
              <p>原稿に納得したら、現役の採用コンサルタントへ。媒体選定から運用までフルサポート。</p>
              <div className="time"><span>初回連絡</span><strong>最短即日</strong></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Form ── */}
      <section className="form-section" id="form">
        <div className="form-wrap">
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div className="section-eyebrow" style={{ justifyContent: "center" }}>FREE GENERATOR</div>
            <h2 className="section-title" style={{ fontSize: 36 }}>求人原稿を生成する</h2>
            <p className="section-sub" style={{ margin: "0 auto" }}>
              6つの質問に答えるだけ。所要時間は約3分。クレジットカード登録は不要です。
            </p>
          </div>

          <div className="form-card">
            <div className="ribbon" />
            <div className="head">
              <div className="titles">
                <span className="step-label">STEP 01 OF 02 — INPUT</span>
                <h2>求人基本情報の入力</h2>
              </div>
            </div>

            <div className="body">
              <form onSubmit={handleSubmit}>
                <div className="form-section-label">企業情報</div>
                <div className="form-grid">
                  <div className="field">
                    <label>
                      <span className="num">1</span> 企業名 <span className="req">必須</span>
                    </label>
                    <input className="input" type="text" name="companyName" placeholder="例：株式会社MixJob" required />
                  </div>
                  <div className="field">
                    <label>
                      <span className="num">2</span> 募集職種名 <span className="req">必須</span>
                    </label>
                    <input className="input" type="text" name="jobTitle" placeholder="例：営業マネージャー" required />
                    <div className="suggestion-chips">
                      <span className="chip-lbl">よく使われる例:</span>
                      <span className="chip">セールス</span>
                      <span className="chip">エンジニア</span>
                      <span className="chip">マーケ</span>
                      <span className="chip">経理</span>
                    </div>
                  </div>
                  <div className="field">
                    <label>
                      <span className="num">3</span> 給与条件 <span className="opt">任意</span>
                    </label>
                    <div className="input-with-prefix">
                      <span className="prefix">JPY</span>
                      <input className="input" type="text" name="salary" placeholder="例：年収500万円〜800万円" />
                    </div>
                  </div>
                  <div className="field">
                    <label>
                      <span className="num">4</span> 勤務地 <span className="opt">任意</span>
                    </label>
                    <input className="input" type="text" name="location" placeholder="例：東京都渋谷区（ハイブリッド可）" />
                  </div>
                </div>

                <div className="divider" />

                <div className="form-section-label">採用したい人物像とミッション</div>
                <div className="form-grid">
                  <div className="field col-span-2">
                    <label>
                      <span className="num">5</span> 具体的な業務内容とミッション <span className="req">必須</span>
                    </label>
                    <textarea
                      className="input"
                      name="content"
                      rows={5}
                      placeholder="どのような課題を解決し、どのようなやりがいがあるか？具体的なエピソードを含めると生成品質が高まります。"
                      required
                    />
                  </div>
                  <div className="field col-span-2">
                    <label>
                      <span className="num">6</span> ターゲット人物像 <span className="opt">任意</span>
                    </label>
                    <textarea
                      className="input"
                      name="persona"
                      rows={3}
                      placeholder="例：人の可能性を広げる仕事に興味がある方／成果にこだわれる方 など"
                    />
                    <div className="suggestion-chips">
                      <span className="chip-lbl">参考タグ:</span>
                      <span className="chip">+ 営業経験あり</span>
                      <span className="chip">+ マネジメント志向</span>
                      <span className="chip">+ 第二新卒歓迎</span>
                      <span className="chip">+ ベンチャー志向</span>
                    </div>
                  </div>
                </div>

                <div className="ai-tip">
                  <div className="icon">AI</div>
                  <div className="body">
                    <strong>採用コンサルタントからのヒント:</strong> 「どんな課題を解決するポジションか」を具体的に書くと、求職者の応募率が平均 <strong>2.3 倍</strong> に向上することがわかっています。数字や成功事例を1つでも盛り込んでみましょう。
                  </div>
                </div>

                {error && <div className="error-box" style={{ marginTop: 16 }}>{error}</div>}

                <div className="submit-row">
                  <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? (
                      <>
                        <svg className="animate-spin" style={{ width: 20, height: 20 }} viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity=".25" />
                          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity=".75" />
                        </svg>
                        専属AIコンサルタントが執筆中...
                      </>
                    ) : (
                      <>求人原稿を無料で生成する <span className="arrow">→</span></>
                    )}
                  </button>
                  <div className="submit-meta">
                    <span className="meta-item">クレカ登録不要</span>
                    <span className="meta-item">入力は3分</span>
                    <span className="meta-item">原稿は何度でも編集可</span>
                    <span className="meta-item">SSL暗号化</span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="testimonials">
        <div style={{ maxWidth: 1080, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div className="section-eyebrow">CUSTOMER VOICES</div>
          <h2 className="section-title">
            1,200 社が選び、<br />97% が「また使いたい」と答えました。
          </h2>
          <p className="section-sub">スタートアップから上場企業まで、職種を問わずご利用いただいています。</p>
          <div className="testimonial-grid">
            <div className="t-card featured">
              <div className="quote-mark">"</div>
              <p className="quote">採用ライターに依頼すると 1 本 8 万円・1 週間。MixJob なら 5 分で同等品質。採用速度がそのまま事業速度になりました。</p>
              <p className="body-quote">エンジニア採用に苦戦していましたが、MixJob で原稿を作り直しただけで応募数が3倍に。コンサルタント相談も的確で、媒体選定の精度も格段に上がりました。</p>
              <div className="meta">
                <div className="avatar" />
                <div className="person">
                  <span className="name">田中 諒</span>
                  <span className="role">SaaS企業 / 人事責任者</span>
                </div>
                <div className="metric">
                  <div className="v">×3.2</div>
                  <div className="l">応募数向上</div>
                </div>
              </div>
            </div>
            <div className="t-card">
              <div className="quote-mark">"</div>
              <p className="quote">採用未経験でも、プロが書いたような原稿が出てくるのが衝撃でした。</p>
              <p className="body-quote">地方の中小製造業で、求人を書ける人がいませんでした。AIに任せてみたら、現場の魅力を上手く引き出してくれて、結果として狙っていた人材を採用できました。</p>
              <div className="meta">
                <div className="avatar" />
                <div className="person">
                  <span className="name">佐藤 美咲</span>
                  <span className="role">製造業 / 総務</span>
                </div>
                <div className="metric">
                  <div className="v">14日</div>
                  <div className="l">採用決定まで</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

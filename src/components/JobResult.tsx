"use client";

import ReactMarkdown from "react-markdown";
import type { JobMeta } from "@/components/HomeClient";

type Props = {
  markdown: string;
  jobMeta: JobMeta;
};

export default function JobResult({ markdown, jobMeta }: Props) {
  const tags = [
    { label: "AI 生成", red: true },
    jobMeta.jobTitle ? { label: jobMeta.jobTitle } : null,
    jobMeta.location ? { label: jobMeta.location } : null,
    jobMeta.salary ? { label: jobMeta.salary } : null,
  ].filter(Boolean) as { label: string; red?: boolean }[];

  return (
    <>
      {/* Success Banner */}
      <section className="success-banner">
        <svg className="confetti" style={{ left: "12%", top: 30 }} width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="5" fill="#f2971b" />
        </svg>
        <svg className="confetti" style={{ left: "20%", top: 120 }} width="22" height="22" viewBox="0 0 22 22">
          <rect x="3" y="3" width="16" height="16" fill="#e84730" transform="rotate(20 11 11)" />
        </svg>
        <svg className="confetti" style={{ right: "16%", top: 60 }} width="28" height="28" viewBox="0 0 28 28">
          <path d="M14 2 L17 11 L26 14 L17 17 L14 26 L11 17 L2 14 L11 11 Z" fill="#f2971b" opacity=".6" />
        </svg>
        <svg className="confetti" style={{ right: "10%", top: 150 }} width="20" height="20" viewBox="0 0 20 20">
          <rect x="2" y="2" width="16" height="16" fill="#e84730" opacity=".5" transform="rotate(45 10 10)" />
        </svg>

        <span className="check-pill">
          <span className="check">✓</span>
          原稿の生成が完了しました
        </span>

        <h1>
          あなただけの<span className="accent">求人原稿</span>が、<br />
          完成しました。
        </h1>
        <p>
          AIが採用ノウハウを凝縮し、応募率を最大化する構成で書き上げました。<br />
          内容を確認の上、プロのコンサルタントとの無料相談へお進みください。
        </p>

      </section>

      {/* Article */}
      <section className="article-section">
        <div className="article-wrap">
          <div className="article-box">
            <div className="tag-row">
              {tags.map((t) => (
                <span key={t.label} className={`tag${t.red ? " red" : ""}`}>{t.label}</span>
              ))}
            </div>

            <h1 className="j-title">
              {jobMeta.jobTitle}
              {jobMeta.companyName && <><br /><span style={{ fontSize: "0.75em", fontWeight: 700 }}>{jobMeta.companyName}</span></>}
            </h1>

            {jobMeta.companyName && (
              <div className="company-line">
                <span className="corp">{jobMeta.companyName}</span>
                {jobMeta.location && <><span className="sep" /><span>{jobMeta.location}</span></>}
                {jobMeta.salary && <><span className="sep" /><span>{jobMeta.salary}</span></>}
              </div>
            )}

            <ReactMarkdown
              components={{
                h3: ({ children }) => <h3>{children}</h3>,
                strong: ({ children }) => <strong>{children}</strong>,
                ul: ({ children }) => <ul>{children}</ul>,
                p: ({ children }) => <p>{children}</p>,
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </div>
      </section>
    </>
  );
}

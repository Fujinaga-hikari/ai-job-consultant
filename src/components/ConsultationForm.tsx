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
          preferredTime: fd.get("preferredTime"),
          agreed: true,
          generationLogId: logId,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(
          typeof json.error === "string"
            ? json.error
            : "送信に失敗しました"
        );
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
      <div className="text-center py-12 space-y-4">
        <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-lg text-lg font-medium">
          リクエストを承りました！担当者より最短即日でご連絡いたします。
        </div>
        <button onClick={onBack} className="text-brand underline text-sm">
          新しい求人を作成する
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">
        プロのコンサルタントに相談する
      </h2>

      <div className="bg-red-50 rounded-2xl p-6 border-l-8 border-brand">
        <p className="font-bold text-brand text-lg mb-2">
          作成した原稿で、さっそく採用をスタートしませんか？
        </p>
        <p className="text-gray-600 text-sm leading-relaxed">
          このAI原稿をベースに、ターゲットへのリーチ方法や最適な媒体選定など、採用成功までプロが伴走支援いたします。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス <span className="text-brand">*</span>
          </label>
          <input
            name="email"
            type="email"
            className="input-field"
            placeholder="your@company.co.jp"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              氏名
            </label>
            <input name="name" className="input-field" placeholder="山田 太郎" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              会社名
            </label>
            <input
              name="companyName"
              className="input-field"
              placeholder="株式会社〇〇"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ご希望の連絡時間帯
          </label>
          <input
            name="preferredTime"
            className="input-field"
            placeholder="例: 平日10:00〜18:00"
          />
        </div>

        <div className="text-sm text-gray-500">
          当社の{" "}
          <a
            href="https://mixjob.co.jp/privacy/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            プライバシーポリシー
          </a>
          {" "}および{" "}
          <a
            href="https://mixjob.co.jp/privacy/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            個人情報保護規定
          </a>
          {" "}に同意の上、ご相談ください。
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-4 h-4 accent-[#e63946]"
          />
          <span className="text-sm text-gray-700">
            上記規定に同意して、無料相談する
          </span>
        </label>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!agreed || loading}
          className="btn-primary w-full text-2xl py-6"
        >
          {loading
            ? "送信中..."
            : "プロのコンサルタントに相談（無料）"}
        </button>
      </form>

      <button
        onClick={onBack}
        className="text-gray-500 hover:text-gray-700 text-sm underline"
      >
        &larr; 情報を修正してもう一度作成する
      </button>
    </div>
  );
}

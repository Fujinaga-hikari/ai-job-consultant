"use client";

import { useState } from "react";
import type { GenerateInput } from "@/lib/validations";

type Props = {
  onGenerated: (result: string, logId: string) => void;
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
      onGenerated(json.result, json.logId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">求人基本情報の入力</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            1. 企業名 <span className="text-brand">*</span>
          </label>
          <input
            name="companyName"
            defaultValue="株式会社サンプル"
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            2. 募集職種名 <span className="text-brand">*</span>
          </label>
          <input
            name="jobTitle"
            defaultValue="セールスマネージャー"
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            3. 給与条件
          </label>
          <input
            name="salary"
            defaultValue="年収600万円〜900万円"
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            4. 勤務地
          </label>
          <input
            name="location"
            defaultValue="東京都渋谷区（ハイブリッド勤務）"
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          5. 具体的な業務内容とミッション <span className="text-brand">*</span>
        </label>
        <textarea
          name="content"
          rows={4}
          className="input-field"
          placeholder="どのような課題を解決し、どのようなやりがいがあるか？"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          6. ターゲット人物像
        </label>
        <textarea
          name="persona"
          rows={3}
          className="input-field"
          placeholder="どのような経験や価値観を持つ人がマッチしますか？"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full text-xl py-4">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            専属AIコンサルタントが最高級の原稿を執筆中...
          </span>
        ) : (
          "求人記事を無料で生成する"
        )}
      </button>
    </form>
  );
}

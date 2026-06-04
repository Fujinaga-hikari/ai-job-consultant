"use client";

import { useState } from "react";

export default function GenerateArticlesButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<{ generated: string[]; failed: string[] } | null>(null);

  async function handleClick() {
    if (!confirm("未生成の記事を全て生成します。Gemini APIを使用します。よろしいですか？")) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/admin/generate-articles", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({ generated: data.generated ?? [], failed: data.failed ?? [] });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={status === "loading"}
        className="inline-flex items-center gap-2 rounded-lg bg-[#e84730] px-4 py-2 text-sm font-bold text-white hover:bg-[#c73020] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading" ? (
          <>
            <span className="animate-spin">⟳</span> 生成中…（1〜2分かかります）
          </>
        ) : (
          "ブログ記事を一括生成"
        )}
      </button>

      {status === "done" && result && (
        <p className="text-sm text-green-600">
          ✓ {result.generated.length}件生成完了
          {result.failed.length > 0 && `、${result.failed.length}件失敗`}
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-500">エラーが発生しました。もう一度お試しください。</p>
      )}
    </div>
  );
}

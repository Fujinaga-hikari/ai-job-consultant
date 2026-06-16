"use client";

import { useState } from "react";

export default function BackfillImagesButton() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<{ updated: number; failed: number; total: number } | null>(null);

  async function run(force: boolean) {
    setStatus("running");
    try {
      const res = await fetch("/api/admin/backfill-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult(data);
        setStatus("done");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={() => run(false)}
        disabled={status === "running"}
        className="text-sm font-semibold px-4 py-2 rounded-lg border border-[#e84730] text-[#e84730] hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {status === "running" ? "実行中…" : "Pexels画像バックフィル"}
      </button>
      <button
        onClick={() => run(true)}
        disabled={status === "running"}
        title="全記事の画像を強制的に再取得して上書きします"
        className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        全件上書き
      </button>
      {status === "done" && result && (
        <span className={`text-sm font-medium ${result.updated > 0 ? "text-green-600" : "text-orange-500"}`}>
          完了 — {result.updated}件更新 / {result.total}件中
          {result.failed > 0 && ` · ${result.failed}件失敗`}
        </span>
      )}
      {status === "error" && (
        <span className="text-sm text-red-500">エラーが発生しました</span>
      )}
    </div>
  );
}

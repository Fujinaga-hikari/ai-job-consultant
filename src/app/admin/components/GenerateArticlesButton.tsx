"use client";

import { useState } from "react";

export default function GenerateArticlesButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState("");

  async function handleClick() {
    if (!confirm("未生成の記事を全て生成します。Gemini APIを使用します。よろしいですか？")) return;
    setStatus("loading");
    setProgress({ done: 0, total: 0 });

    let done = 0;
    // 最大10回ループ（キーワード数以上は回らない）
    for (let i = 0; i < 10; i++) {
      try {
        const res = await fetch("/api/admin/generate-articles", { method: "POST" });
        const data = await res.json();

        if (!res.ok) {
          setErrorMsg(data.error ?? "不明なエラー");
          setStatus("error");
          return;
        }

        // 全記事生成済みだった場合
        if (data.message === "全記事生成済み") {
          setErrorMsg("");
          setStatus("done");
          setProgress({ done: 0, total: 0 });
          return;
        }

        done++;
        const remaining = data.remaining ?? 0;
        setProgress({ done, total: done + remaining });

        if (remaining === 0) break;
      } catch {
        setErrorMsg("通信エラーが発生しました");
        setStatus("error");
        return;
      }
    }

    setStatus("done");
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
            <span className="animate-spin inline-block">⟳</span>
            {progress.total > 0
              ? `生成中… ${progress.done} / ${progress.total}件`
              : "生成中…"}
          </>
        ) : (
          "ブログ記事を一括生成"
        )}
      </button>

      {status === "done" && progress.done > 0 && (
        <p className="text-sm text-green-600">✓ {progress.done}件生成完了</p>
      )}
      {status === "done" && progress.done === 0 && (
        <p className="text-sm text-gray-500">
          全キーワード生成済みです。
          <a href="/admin/articles" className="text-[#e84730] hover:underline ml-1">
            キーワード一覧を見る
          </a>
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-500">エラー: {errorMsg}</p>
      )}
    </div>
  );
}

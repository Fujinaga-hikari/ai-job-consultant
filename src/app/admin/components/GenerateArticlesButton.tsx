"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MASS_QUEUE_TARGET = 15;
const MASS_GENERATE_LIMIT = 15;

export default function GenerateArticlesButton() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleClick() {
    if (
      !confirm(
        `AIがキーワードを補充し、記事を最大${MASS_GENERATE_LIMIT}件まで自動生成します（時間・API料金がかかります）。よろしいですか？`,
      )
    ) {
      return;
    }
    setStatus("loading");
    setMessage("キーワード補充中…");

    try {
      const suggestRes = await fetch("/api/admin/suggest-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetQueueSize: MASS_QUEUE_TARGET }),
      });
      const suggestJson = await suggestRes.json();
      if (!suggestRes.ok || !suggestJson.ok) {
        throw new Error(suggestJson.error ?? "キーワード提案に失敗しました");
      }

      let generated = 0;
      for (let i = 0; i < MASS_GENERATE_LIMIT; i++) {
        setMessage(`記事生成中… ${generated + 1} / ${MASS_GENERATE_LIMIT}`);
        const res = await fetch("/api/admin/generate-articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error ?? "生成に失敗しました");
        if (!data.generated) break;
        generated++;
      }

      setMessage(`キーワード ${suggestJson.count ?? 0} 件追加 · 記事 ${generated} 件生成`);
      setStatus("done");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "通信エラーが発生しました");
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      <button
        onClick={handleClick}
        disabled={status === "loading"}
        className="inline-flex items-center gap-2 rounded-lg bg-[#e84730] px-4 py-2 text-sm font-bold text-white hover:bg-[#c73020] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading" ? (
          <>
            <span className="animate-spin inline-block">⟳</span>
            {message}
          </>
        ) : (
          "🚀 大量生産（最大15件）"
        )}
      </button>

      {status === "done" && <p className="text-sm text-green-600">✓ {message}</p>}
      {status === "error" && <p className="text-sm text-red-500">エラー: {message}</p>}
      <a href="/admin/articles" className="text-sm text-[#e84730] hover:underline">
        キーワード一覧・詳細設定 →
      </a>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ArticleGenerator({ remaining }: { remaining: number }) {
  const router = useRouter();
  const [count, setCount] = useState(1);
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  if (remaining === 0) {
    return (
      <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
        全記事生成済み
      </span>
    );
  }

  async function handleGenerate() {
    setState("running");
    setProgress(0);
    setErrorMsg("");

    for (let i = 0; i < count; i++) {
      try {
        const res = await fetch("/api/admin/generate-articles", { method: "POST" });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          setErrorMsg(json.error ?? "生成に失敗しました");
          setState("error");
          return;
        }
        setProgress(i + 1);
      } catch {
        setErrorMsg("通信エラーが発生しました");
        setState("error");
        return;
      }
    }

    setState("done");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      {state === "running" && (
        <span className="text-sm text-gray-500">
          {progress} / {count} 件生成中…
        </span>
      )}
      {state === "done" && (
        <span className="text-sm text-green-600 font-medium">{count} 件生成完了 ✓</span>
      )}
      {state === "error" && (
        <span className="text-sm text-red-500">{errorMsg}</span>
      )}

      {state !== "running" && (
        <>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e84730]/30"
            >
              {Array.from({ length: remaining }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n} 件</option>
              ))}
            </select>
            <span className="text-gray-400 text-xs">／残り {remaining} 件</span>
          </div>
          <button
            onClick={handleGenerate}
            className="flex items-center gap-1.5 bg-[#e84730] hover:bg-[#c73020] text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            今すぐ生成
          </button>
        </>
      )}
    </div>
  );
}

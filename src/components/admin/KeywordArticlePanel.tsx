"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type KeywordRow = {
  slug: string;
  keyword: string;
  titleHint: string;
  status: "pending" | "published";
  title?: string;
};

async function generateOne(slug: string) {
  const res = await fetch("/api/admin/generate-articles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug }),
  });
  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.error ?? "生成に失敗しました");
  }
  return json as { generated: string; keyword: string };
}

export default function KeywordArticlePanel({ keywords }: { keywords: KeywordRow[] }) {
  const router = useRouter();
  const pending = useMemo(
    () => keywords.filter((k) => k.status === "pending"),
    [keywords],
  );
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [currentKeyword, setCurrentKeyword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  function toggle(slug: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(slug);
      else next.delete(slug);
      return next;
    });
  }

  function selectAllPending() {
    setSelected(new Set(pending.map((k) => k.slug)));
  }

  async function runGeneration(slugs: string[]) {
    if (slugs.length === 0) return;
    setState("running");
    setProgress({ done: 0, total: slugs.length });
    setErrorMsg("");

    for (let i = 0; i < slugs.length; i++) {
      const slug = slugs[i];
      const row = keywords.find((k) => k.slug === slug);
      setCurrentKeyword(row?.keyword ?? slug);
      try {
        await generateOne(slug);
        setProgress({ done: i + 1, total: slugs.length });
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "生成に失敗しました");
        setState("error");
        return;
      }
    }

    setState("done");
    setSelected(new Set());
    router.refresh();
  }

  return (
    <section className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-800">キーワード選定・記事生成</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            未生成 {pending.length} 件 / 全 {keywords.length} 件（Gemini で SEO 記事を自動作成）
          </p>
        </div>
        {pending.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={selectAllPending}
              disabled={state === "running"}
              className="text-xs text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
            >
              未生成をすべて選択
            </button>
            <button
              type="button"
              onClick={() => runGeneration(pending.map((k) => k.slug))}
              disabled={state === "running"}
              className="text-sm font-semibold text-white bg-[#f2971b] hover:bg-[#d9820f] rounded-lg px-4 py-2 disabled:opacity-50"
            >
              未生成を一括生成
            </button>
            <button
              type="button"
              onClick={() => runGeneration([...selected])}
              disabled={state === "running" || selected.size === 0}
              className="text-sm font-bold text-white bg-[#e84730] hover:bg-[#c73020] rounded-lg px-4 py-2 disabled:opacity-50"
            >
              選択したキーワードを生成（{selected.size}件）
            </button>
          </div>
        )}
      </div>

      {state === "running" && (
        <div className="px-5 py-3 bg-orange-50 text-sm text-orange-800 border-b border-orange-100">
          生成中… {progress.done} / {progress.total} 件
          {currentKeyword && <span className="ml-2 text-orange-600">「{currentKeyword}」</span>}
        </div>
      )}
      {state === "done" && (
        <div className="px-5 py-3 bg-green-50 text-sm text-green-700 border-b border-green-100">
          ✓ {progress.done} 件の記事を生成しました
        </div>
      )}
      {state === "error" && (
        <div className="px-5 py-3 bg-red-50 text-sm text-red-600 border-b border-red-100">
          エラー: {errorMsg}
        </div>
      )}

      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
          <tr>
            <th className="w-10 px-4 py-3" />
            <th className="text-left px-4 py-3 font-medium">キーワード</th>
            <th className="text-left px-4 py-3 font-medium">記事タイトル案</th>
            <th className="text-left px-4 py-3 font-medium">状態</th>
            <th className="px-4 py-3 font-medium text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {keywords.map((row) => {
            const isPending = row.status === "pending";
            const checked = selected.has(row.slug);
            return (
              <tr key={row.slug} className={isPending ? "bg-white" : "bg-gray-50/50"}>
                <td className="px-4 py-3 text-center">
                  {isPending ? (
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={state === "running"}
                      onChange={(e) => toggle(row.slug, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">{row.keyword}</td>
                <td className="px-4 py-3 text-gray-600">{row.titleHint}</td>
                <td className="px-4 py-3">
                  {isPending ? (
                    <span className="inline-block text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                      未生成
                    </span>
                  ) : (
                    <span className="inline-block text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full">
                      生成済み
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {isPending ? (
                    <button
                      type="button"
                      disabled={state === "running"}
                      onClick={() => runGeneration([row.slug])}
                      className="text-xs font-semibold text-[#e84730] hover:underline disabled:opacity-50"
                    >
                      この1件を生成
                    </button>
                  ) : (
                    <a
                      href={`/blog/${row.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#e84730] hover:underline"
                    >
                      記事を見る →
                    </a>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {pending.length === 0 && (
        <div className="px-5 py-4 text-sm text-gray-500 border-t border-gray-100">
          登録済みキーワードはすべて生成済みです。新しいキーワードを追加する場合は開発担当へ連絡してください。
        </div>
      )}
    </section>
  );
}

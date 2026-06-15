"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type KeywordRow = {
  slug: string;
  keyword: string;
  titleHint: string;
  source: "SEED" | "AI" | "MANUAL";
  status: "pending" | "published" | "failed";
  title?: string;
  error?: string;
};

const SOURCE_LABEL: Record<KeywordRow["source"], string> = {
  SEED: "初期",
  AI: "AI提案",
  MANUAL: "手動",
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

async function generateNext() {
  const res = await fetch("/api/admin/generate-articles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.error ?? "生成に失敗しました");
  }
  return json as { generated: string | null; keyword?: string; message?: string };
}

const MASS_QUEUE_TARGET = 15;
const MASS_GENERATE_LIMIT = 15;

export default function KeywordArticlePanel({ keywords }: { keywords: KeywordRow[] }) {
  const router = useRouter();
  const pending = useMemo(
    () => keywords.filter((k) => k.status === "pending" || k.status === "failed"),
    [keywords],
  );
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [currentKeyword, setCurrentKeyword] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
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
    setStatusMsg("");

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

  async function suggestKeywords(count: number) {
    setState("running");
    setStatusMsg(`AIがキーワードを${count}件考えています…`);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/suggest-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "提案に失敗しました");
      setState("done");
      setStatusMsg(`✓ AIが ${json.count} 件のキーワードを追加しました`);
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "提案に失敗しました");
      setState("error");
    }
  }

  async function runMassProduction() {
    if (
      !confirm(
        `AIがキーワードを最大${MASS_QUEUE_TARGET}件ストックし、記事を最大${MASS_GENERATE_LIMIT}件まで連続生成します。\nGemini API料金がかかり、30〜60分ほどかかる場合があります。続行しますか？`,
      )
    ) {
      return;
    }

    setState("running");
    setErrorMsg("");
    setProgress({ done: 0, total: MASS_GENERATE_LIMIT });

    try {
      setStatusMsg(`ステップ1/2: AIがキーワードを${MASS_QUEUE_TARGET}件まで補充中…`);
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
      setStatusMsg(`ステップ2/2: 記事を生成中…（0 / ${MASS_GENERATE_LIMIT}）`);

      for (let i = 0; i < MASS_GENERATE_LIMIT; i++) {
        const json = await generateNext();
        if (!json.generated) break;
        generated++;
        setCurrentKeyword(json.keyword ?? json.generated);
        setProgress({ done: generated, total: MASS_GENERATE_LIMIT });
        setStatusMsg(`ステップ2/2: 記事を生成中…（${generated} / ${MASS_GENERATE_LIMIT}）`);
      }

      setState("done");
      setStatusMsg(
        `✓ キーワード ${suggestJson.count ?? 0} 件追加 · 記事 ${generated} 件生成完了`,
      );
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "大量生成に失敗しました");
      setState("error");
    }
  }

  async function runAutoPipeline() {
    if (!confirm("AIがキーワードを提案し、記事を自動生成します（Gemini API使用）。よろしいですか？")) {
      return;
    }
    setState("running");
    setStatusMsg("AIがキーワードを考え、記事を生成しています…（数分かかります）");
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/auto-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minQueueSize: 10, maxGenerate: 5 }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "自動生成に失敗しました");
      setState("done");
      setStatusMsg(
        `✓ キーワード ${json.suggested?.length ?? 0} 件提案 · 記事 ${json.generated?.length ?? 0} 件生成 · 残り ${json.remaining ?? 0} 件`,
      );
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "自動生成に失敗しました");
      setState("error");
    }
  }

  const isRunning = state === "running";

  return (
    <section className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-800">キーワード選定・記事生成</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              未生成 {pending.length} 件 / 全 {keywords.length} 件
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-100">
          <button
            type="button"
            onClick={runMassProduction}
            disabled={isRunning}
            className="text-sm font-bold text-white bg-[#e84730] hover:bg-[#c73020] rounded-lg px-5 py-2.5 disabled:opacity-50 shadow-sm"
          >
            🚀 大量生産（最大15件）
          </button>
          <button
            type="button"
            onClick={runAutoPipeline}
            disabled={isRunning}
            className="text-sm font-semibold text-[#e84730] bg-white border border-[#e84730]/30 rounded-lg px-4 py-2 hover:bg-red-50 disabled:opacity-50"
          >
            お試し生成（5件まで）
          </button>
          <button
            type="button"
            onClick={() => suggestKeywords(10)}
            disabled={isRunning}
            className="text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
          >
            キーワードだけ10件提案
          </button>
          <span className="text-xs text-gray-500">
            記事の公開はボタン操作時のみ（自動 Cron は無効）
          </span>
        </div>

        {pending.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={selectAllPending}
              disabled={isRunning}
              className="text-xs text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
            >
              未生成をすべて選択
            </button>
            <button
              type="button"
              onClick={() => runGeneration(pending.map((k) => k.slug))}
              disabled={isRunning}
              className="text-sm font-semibold text-white bg-[#f2971b] hover:bg-[#d9820f] rounded-lg px-4 py-2 disabled:opacity-50"
            >
              未生成を一括生成
            </button>
            <button
              type="button"
              onClick={() => runGeneration([...selected])}
              disabled={isRunning || selected.size === 0}
              className="text-sm font-bold text-white bg-gray-700 hover:bg-gray-800 rounded-lg px-4 py-2 disabled:opacity-50"
            >
              選択したキーワードを生成（{selected.size}件）
            </button>
          </div>
        )}
      </div>

      {isRunning && (
        <div className="px-5 py-3 bg-orange-50 text-sm text-orange-800 border-b border-orange-100">
          {statusMsg || `生成中… ${progress.done} / ${progress.total} 件`}
          {currentKeyword && !statusMsg && (
            <span className="ml-2 text-orange-600">「{currentKeyword}」</span>
          )}
        </div>
      )}
      {state === "done" && statusMsg && (
        <div className="px-5 py-3 bg-green-50 text-sm text-green-700 border-b border-green-100">
          {statusMsg}
        </div>
      )}
      {state === "done" && !statusMsg && progress.total > 0 && (
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
            <th className="text-left px-4 py-3 font-medium">由来</th>
            <th className="text-left px-4 py-3 font-medium">状態</th>
            <th className="px-4 py-3 font-medium text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {keywords.map((row) => {
            const isPending = row.status === "pending" || row.status === "failed";
            const checked = selected.has(row.slug);
            return (
              <tr key={row.slug} className={isPending ? "bg-white" : "bg-gray-50/50"}>
                <td className="px-4 py-3 text-center">
                  {isPending ? (
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isRunning}
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
                  <span className="inline-block text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {SOURCE_LABEL[row.source]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {row.status === "pending" && (
                    <span className="inline-block text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                      未生成
                    </span>
                  )}
                  {row.status === "published" && (
                    <span className="inline-block text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full">
                      生成済み
                    </span>
                  )}
                  {row.status === "failed" && (
                    <span
                      className="inline-block text-xs font-semibold text-red-700 bg-red-50 px-2 py-1 rounded-full"
                      title={row.error}
                    >
                      失敗
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {isPending ? (
                    <button
                      type="button"
                      disabled={isRunning}
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

      {keywords.length === 0 && (
        <div className="px-5 py-4 text-sm text-gray-500 border-t border-gray-100">
          キーワードがありません。「AIに任せる」で自動的に提案・生成できます。
        </div>
      )}
    </section>
  );
}

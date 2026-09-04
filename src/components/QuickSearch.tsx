"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, CornerDownLeft, Plus } from "lucide-react";
import { excerpt, colorSwatch } from "@/lib/utils";

type Result = {
  id: string;
  title: string;
  content: string;
  color: string;
  isJournal: boolean;
  tags: string[];
};

export function QuickSearch({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [active, setActive] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      const res = await fetch(`/api/cards?q=${encodeURIComponent(q)}&limit=12`, {
        signal: ctrl.signal,
      }).catch(() => null);
      if (res?.ok) {
        setResults(await res.json());
        setActive(0);
      }
    }, 120);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const canCreate = q.trim().length > 0 && !results.some((r) => r.title === q.trim());
  const total = results.length + (canCreate ? 1 : 0);

  async function choose(i: number) {
    if (i < results.length) {
      router.push(`/cards/${results[i].id}`);
      onClose();
    } else if (canCreate) {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: q.trim() }),
      });
      const c = await res.json();
      router.push(`/cards/${c.id}?new=1`);
      router.refresh();
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-stone-900/30 pt-[12vh] backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(total - 1, a + 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            }
            if (e.key === "Enter") {
              e.preventDefault();
              choose(active);
            }
          }}
          placeholder="カードを検索、または新規作成…"
          className="w-full border-b border-stone-100 px-5 py-4 text-base outline-none placeholder:text-stone-400"
        />
        <ul className="max-h-[50vh] overflow-y-auto p-2">
          {results.map((r, i) => (
            <li key={r.id}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={`flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left ${
                  active === i ? "bg-indigo-50" : ""
                }`}
              >
                <span
                  className="mt-1 h-3 w-3 shrink-0 rounded-sm border border-stone-300"
                  style={{ background: colorSwatch(r.color) }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{r.title}</span>
                  <span className="block truncate text-xs text-stone-500">
                    {excerpt(r.content, 80) || "（空のカード）"}
                  </span>
                </span>
                {active === i && <CornerDownLeft size={14} className="mt-1 text-stone-400" />}
              </button>
            </li>
          ))}
          {canCreate && (
            <li>
              <button
                onMouseEnter={() => setActive(results.length)}
                onClick={() => choose(results.length)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                  active === results.length ? "bg-indigo-50" : ""
                }`}
              >
                <Plus size={14} className="text-indigo-600" />
                <span>
                  「<b>{q.trim()}</b>」を新しいカードとして作成
                </span>
              </button>
            </li>
          )}
          {results.length === 0 && !canCreate && (
            <li className="flex items-center gap-2 px-3 py-6 text-sm text-stone-400">
              <FileText size={14} /> 入力してカードを検索
            </li>
          )}
        </ul>
        <div className="flex gap-3 border-t border-stone-100 px-4 py-2 text-[11px] text-stone-400">
          <span>↑↓ 移動</span>
          <span>↵ 開く</span>
          <span>esc 閉じる</span>
        </div>
      </div>
    </div>
  );
}

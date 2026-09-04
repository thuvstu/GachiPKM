"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutGrid, Plus, Trash2 } from "lucide-react";
import { relativeTime } from "@/lib/utils";

type Board = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  updatedAt: string;
  nodeCount: number;
};

const EMOJIS = ["🗺️", "🧠", "💡", "📚", "🎯", "🔬", "🎨", "🚀", "🌱", "🧩"];

export function WhiteboardList({ boards }: { boards: Board[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🗺️");
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/whiteboards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, emoji }),
    });
    const b = await res.json();
    setBusy(false);
    router.push(`/whiteboards/${b.id}`);
  }

  async function remove(b: Board) {
    if (!confirm(`ホワイトボード「${b.name}」を削除しますか？（カード自体は削除されません）`)) return;
    await fetch(`/api/whiteboards/${b.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <LayoutGrid className="text-indigo-500" size={22} /> ホワイトボード
          </h1>
          <p className="text-sm text-stone-500">カードを空間に広げ、繋ぎ、構造を発見する。</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 rounded-lg bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700"
        >
          <Plus size={14} /> 新しいボード
        </button>
      </div>

      {open && (
        <form
          onSubmit={create}
          className="mb-6 flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4"
        >
          <div className="flex gap-1">
            {EMOJIS.map((e) => (
              <button
                type="button"
                key={e}
                onClick={() => setEmoji(e)}
                className={`rounded-md p-1 text-lg ${emoji === e ? "bg-white shadow ring-1 ring-indigo-300" : "hover:bg-white/60"}`}
              >
                {e}
              </button>
            ))}
          </div>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ボード名"
            className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
          />
          <button
            disabled={busy}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            作成
          </button>
          <button type="button" onClick={() => setOpen(false)} className="text-sm text-stone-500">
            キャンセル
          </button>
        </form>
      )}

      {boards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 p-16 text-center text-stone-400">
          まだホワイトボードがありません
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {boards.map((b) => (
            <div
              key={b.id}
              className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Link href={`/whiteboards/${b.id}`} className="block p-5">
                <div
                  className="mb-4 h-24 rounded-xl border border-stone-100"
                  style={{
                    backgroundColor: "#faf9f6",
                    backgroundImage: "radial-gradient(#d6d3d1 1px, transparent 1px)",
                    backgroundSize: "14px 14px",
                  }}
                >
                  <div className="flex h-full items-center justify-center text-4xl">{b.emoji}</div>
                </div>
                <div className="text-base font-semibold">{b.name}</div>
                {b.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-stone-500">{b.description}</p>
                )}
                <div className="mt-3 text-[11px] text-stone-400">
                  {b.nodeCount} カード · {relativeTime(b.updatedAt)}
                </div>
              </Link>
              <button
                onClick={() => remove(b)}
                className="absolute right-3 top-3 rounded-md bg-white/80 p-1.5 text-stone-400 opacity-0 transition hover:text-rose-600 group-hover:opacity-100"
                title="削除"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

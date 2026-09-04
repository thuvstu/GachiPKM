"use client";

import { useEffect, useState } from "react";
import { GripVertical, Plus, Search } from "lucide-react";
import { colorSwatch, excerpt } from "@/lib/utils";

type Item = { id: string; title: string; content: string; color: string; isJournal: boolean };

export function CardLibrary({
  excludeIds,
  onPick,
}: {
  excludeIds: Set<string>;
  onPick: (cardId: string) => void;
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/cards?q=${encodeURIComponent(q)}&limit=100`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((rows: Item[]) => {
          setItems(rows);
          setLoading(false);
        })
        .catch(() => {});
    }, 150);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const visible = items.filter((i) => !excludeIds.has(i.id));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="p-3">
        <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5">
          <Search size={13} className="text-stone-400" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="カードを検索…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <p className="mt-2 text-[11px] text-stone-400">
          クリックで中央に追加、またはキャンバスへドラッグ＆ドロップ
        </p>
      </div>
      <ul className="flex-1 space-y-1.5 overflow-y-auto px-3 pb-3">
        {visible.map((c) => (
          <li
            key={c.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/pkm-card", c.id);
              e.dataTransfer.effectAllowed = "copy";
            }}
            className="group flex cursor-grab items-start gap-2 rounded-lg border border-stone-200 bg-white p-2.5 shadow-sm hover:border-indigo-300 active:cursor-grabbing"
          >
            <GripVertical size={14} className="mt-0.5 shrink-0 text-stone-300" />
            <span
              className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm border border-stone-300"
              style={{ background: colorSwatch(c.color) }}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">{c.title}</div>
              <div className="line-clamp-2 text-[11px] text-stone-500">
                {excerpt(c.content, 90) || "（空のカード）"}
              </div>
            </div>
            <button
              onClick={() => onPick(c.id)}
              className="rounded-md p-1 text-stone-400 opacity-0 hover:bg-indigo-50 hover:text-indigo-600 group-hover:opacity-100"
              title="追加"
            >
              <Plus size={14} />
            </button>
          </li>
        ))}
        {!loading && visible.length === 0 && (
          <li className="py-8 text-center text-xs text-stone-400">
            {q ? "該当するカードがありません" : "すべてのカードが配置済みです"}
          </li>
        )}
      </ul>
    </div>
  );
}

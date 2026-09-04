"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, Unlink } from "lucide-react";
import { CARD_COLORS } from "@/lib/utils";
import type { CardNodeData } from "./CardNode";

export function CardPanel({
  data,
  onChange,
  onRemove,
}: {
  nodeId: string;
  data: CardNodeData;
  onChange: (patch: Partial<CardNodeData>) => void;
  onRemove: () => void;
}) {
  const [title, setTitle] = useState(data.title);
  const [content, setContent] = useState(data.content);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const last = useRef({ title: data.title, content: data.content });

  useEffect(() => {
    if (title === last.current.title && content === last.current.content) return;
    const t = setTimeout(async () => {
      const patch: { title?: string; content?: string } = {};
      if (title !== last.current.title) patch.title = title;
      if (content !== last.current.content) patch.content = content;
      last.current = { title, content };
      setStatus("saving");
      const res = await fetch(`/api/cards/${data.cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const c = await res.json();
        onChange({ title: c.title, content: c.content });
        setStatus("saved");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [title, content, data.cardId, onChange]);

  async function setColor(color: string) {
    onChange({ color });
    await fetch(`/api/cards/${data.cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color }),
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent text-lg font-semibold tracking-tight outline-none"
          placeholder="タイトル"
        />
        <div className="my-3 flex items-center gap-1.5">
          {CARD_COLORS.map((c) => (
            <button
              key={c.key}
              onClick={() => setColor(c.key)}
              title={c.label}
              className={`h-4 w-4 rounded-full border ${
                data.color === c.key ? "scale-125 border-stone-700" : "border-stone-300"
              }`}
              style={{ background: c.swatch }}
            />
          ))}
          <span className="ml-auto text-[11px] text-stone-400">
            {status === "saving" ? "保存中…" : status === "saved" ? "保存済み" : ""}
          </span>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={"内容を入力… [[リンク]] や #タグ も使えます"}
          className="editor-textarea h-[55vh] w-full resize-none rounded-lg border border-stone-200 bg-stone-50 p-3 text-[13px] outline-none focus:border-indigo-300 focus:bg-white"
          spellCheck={false}
        />
      </div>
      <div className="flex items-center gap-2 border-t border-stone-100 p-3">
        <Link
          href={`/cards/${data.cardId}`}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-700"
        >
          <ExternalLink size={12} /> カードを開く
        </Link>
        <button
          onClick={onRemove}
          className="flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          title="ボードから外す（カードは残ります）"
        >
          <Unlink size={12} /> 外す
        </button>
      </div>
    </div>
  );
}

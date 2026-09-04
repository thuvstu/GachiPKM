"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Columns2,
  Eye,
  LayoutGrid,
  Link2,
  Loader2,
  Pencil,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";
import { Markdown } from "./Markdown";
import { CardTile } from "./CardTile";
import { CARD_COLORS, colorClasses, colorSwatch, relativeTime } from "@/lib/utils";

type Mini = { id: string; title: string; color: string };
type Tile = {
  id: string;
  title: string;
  content: string;
  color: string;
  isJournal: boolean;
  pinned: boolean;
  updatedAt: string;
  tags: string[];
};

export type EditorCard = {
  id: string;
  title: string;
  content: string;
  color: string;
  isJournal: boolean;
  journalDate: string | null;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  outgoing: Mini[];
  backlinks: Tile[];
  boards: { id: string; name: string; emoji: string }[];
  unlinked: Tile[];
};

type Mode = "edit" | "split" | "preview";

export function CardEditor({
  card,
  autoFocusTitle,
}: {
  card: EditorCard;
  autoFocusTitle?: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(card.title);
  const [content, setContent] = useState(card.content);
  const [color, setColor] = useState(card.color);
  const [pinned, setPinned] = useState(card.pinned);
  const [mode, setMode] = useState<Mode>(card.content ? "split" : "edit");
  const [status, setStatus] = useState<"saved" | "saving" | "dirty">("saved");
  const [outgoing, setOutgoing] = useState<Mini[]>(card.outgoing);
  const titleRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSaved = useRef({ title: card.title, content: card.content });

  // autocomplete for [[
  const [ac, setAc] = useState<{ query: string; start: number; items: Mini[]; idx: number } | null>(
    null,
  );

  useEffect(() => {
    if (autoFocusTitle) {
      titleRef.current?.focus();
      titleRef.current?.select();
    }
  }, [autoFocusTitle]);

  const links = useMemo(() => {
    const m: Record<string, string> = {};
    for (const o of outgoing) m[o.title.toLowerCase()] = o.id;
    return m;
  }, [outgoing]);

  const save = useCallback(
    async (patch: { title?: string; content?: string; color?: string; pinned?: boolean }) => {
      setStatus("saving");
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        if (patch.content !== undefined) {
          // refresh outgoing link map so new [[links]] resolve in preview
          const detail = await fetch(`/api/cards/${card.id}`).then((r) => r.json());
          setOutgoing(detail.outgoing ?? []);
        }
        setStatus("saved");
      } else {
        setStatus("dirty");
      }
    },
    [card.id],
  );

  // Debounced autosave for title/content
  useEffect(() => {
    if (title === lastSaved.current.title && content === lastSaved.current.content) return;
    setStatus("dirty");
    const t = setTimeout(() => {
      const patch: { title?: string; content?: string } = {};
      if (title !== lastSaved.current.title) patch.title = title;
      if (content !== lastSaved.current.content) patch.content = content;
      lastSaved.current = { title, content };
      save(patch);
    }, 600);
    return () => clearTimeout(t);
  }, [title, content, save]);

  // Flush on unmount / navigate away (use a ref so the cleanup sees the latest values)
  const latest = useRef({ title, content });
  latest.current = { title, content };
  useEffect(() => {
    return () => {
      const { title: t, content: c } = latest.current;
      if (t !== lastSaved.current.title || c !== lastSaved.current.content) {
        const body = JSON.stringify({ title: t, content: c });
        navigator.sendBeacon?.(
          `/api/cards/${card.id}`,
          new Blob([body], { type: "application/json" }),
        );
      }
    };
  }, [card.id]);

  async function changeColor(c: string) {
    setColor(c);
    await save({ color: c });
  }
  async function togglePin() {
    setPinned(!pinned);
    await save({ pinned: !pinned });
  }
  async function remove() {
    if (!confirm(`「${title}」を削除しますか？この操作は取り消せません。`)) return;
    await fetch(`/api/cards/${card.id}`, { method: "DELETE" });
    router.push("/cards");
    router.refresh();
  }

  // ---- [[ autocomplete ----
  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setContent(val);
    const pos = e.target.selectionStart;
    const before = val.slice(0, pos);
    const m = before.match(/\[\[([^\[\]\n]*)$/);
    if (m) {
      const query = m[1];
      const start = pos - query.length;
      setAc((prev) => ({ query, start, items: prev?.items ?? [], idx: 0 }));
      fetch(`/api/cards?q=${encodeURIComponent(query)}&limit=8`)
        .then((r) => r.json())
        .then((items: Mini[]) =>
          setAc((prev) =>
            prev && prev.query === query
              ? { ...prev, items: items.filter((i) => i.id !== card.id) }
              : prev,
          ),
        );
    } else {
      setAc(null);
    }
  }

  function applyAc(item: Mini) {
    if (!ac) return;
    const ta = textareaRef.current;
    const pos = ta?.selectionStart ?? ac.start + ac.query.length;
    const before = content.slice(0, ac.start);
    const after = content.slice(pos);
    const closing = after.startsWith("]]") ? after.slice(2) : after;
    const next = `${before}${item.title}]]${closing}`;
    setContent(next);
    setAc(null);
    requestAnimationFrame(() => {
      const p = before.length + item.title.length + 2;
      ta?.setSelectionRange(p, p);
      ta?.focus();
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (ac && ac.items.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setAc({ ...ac, idx: (ac.idx + 1) % ac.items.length });
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setAc({ ...ac, idx: (ac.idx - 1 + ac.items.length) % ac.items.length });
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        applyAc(ac.items[ac.idx]);
        return;
      }
      if (e.key === "Escape") {
        setAc(null);
        return;
      }
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const s = ta.selectionStart;
      const next = content.slice(0, s) + "  " + content.slice(ta.selectionEnd);
      setContent(next);
      requestAnimationFrame(() => ta.setSelectionRange(s + 2, s + 2));
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
    }
  }

  const showEditor = mode !== "preview";
  const showPreview = mode !== "edit";

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-2 border-b border-stone-200 bg-white/70 px-4 py-2 backdrop-blur">
        <button
          onClick={() => router.back()}
          className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100"
          title="戻る"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-1 text-xs text-stone-400">
          {status === "saving" && (
            <>
              <Loader2 size={12} className="animate-spin" /> 保存中
            </>
          )}
          {status === "saved" && (
            <>
              <Check size={12} className="text-emerald-500" /> 保存済み
            </>
          )}
          {status === "dirty" && <span>編集中…</span>}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white p-0.5">
          {(
            [
              ["edit", Pencil, "編集"],
              ["split", Columns2, "分割"],
              ["preview", Eye, "プレビュー"],
            ] as const
          ).map(([m, Icon, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              title={label}
              className={`rounded-md p-1.5 ${mode === m ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-100"}`}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
        <div className="mx-1 flex items-center gap-1">
          {CARD_COLORS.map((c) => (
            <button
              key={c.key}
              onClick={() => changeColor(c.key)}
              title={c.label}
              className={`h-4 w-4 rounded-full border transition ${
                color === c.key ? "scale-125 border-stone-700" : "border-stone-300"
              }`}
              style={{ background: c.swatch }}
            />
          ))}
        </div>
        <button
          onClick={togglePin}
          className={`rounded-md p-1.5 ${pinned ? "text-indigo-600" : "text-stone-400"} hover:bg-stone-100`}
          title={pinned ? "ピン解除" : "ピン留め"}
        >
          {pinned ? <Pin size={16} /> : <PinOff size={16} />}
        </button>
        <button
          onClick={remove}
          className="rounded-md p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
          title="削除"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className={`min-h-full ${colorClasses(color).split(" ")[0]}`}>
          <div className="mx-auto max-w-5xl px-8 pt-8 pb-16">
            <div className="mb-1 flex items-center gap-2 text-xs text-stone-400">
              {card.isJournal && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
                  <BookOpen size={11} /> ジャーナル
                </span>
              )}
              <span>作成 {relativeTime(card.createdAt)}</span>
              <span>·</span>
              <span>更新 {relativeTime(card.updatedAt)}</span>
            </div>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  textareaRef.current?.focus();
                }
              }}
              placeholder="タイトル"
              className="w-full bg-transparent text-3xl font-bold tracking-tight outline-none placeholder:text-stone-300"
            />

            <div className={`mt-6 grid gap-6 ${showEditor && showPreview ? "grid-cols-2" : "grid-cols-1"}`}>
              {showEditor && (
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleContentChange}
                    onKeyDown={handleKeyDown}
                    onBlur={() => setTimeout(() => setAc(null), 150)}
                    placeholder={"ここに書き始めましょう…\n\n[[カード名]] でリンク、#タグ でタグ付け。Markdown 対応。"}
                    className="editor-textarea min-h-[60vh] w-full resize-none rounded-xl border border-stone-200/70 bg-white/60 p-4 outline-none focus:border-indigo-300 focus:bg-white"
                    spellCheck={false}
                  />
                  {ac && ac.items.length > 0 && (
                    <div className="absolute left-4 top-12 z-10 w-72 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-xl">
                      <div className="border-b border-stone-100 px-3 py-1 text-[10px] uppercase tracking-wider text-stone-400">
                        カードにリンク
                      </div>
                      {ac.items.map((it, i) => (
                        <button
                          key={it.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            applyAc(it);
                          }}
                          className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${
                            i === ac.idx ? "bg-indigo-50" : ""
                          }`}
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-sm border border-stone-300"
                            style={{ background: colorSwatch(it.color) }}
                          />
                          <span className="truncate">{it.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {showPreview && (
                <div className="min-h-[60vh] rounded-xl border border-stone-200/70 bg-white/70 p-5">
                  {content.trim() ? (
                    <Markdown content={content} links={links} />
                  ) : (
                    <p className="text-sm italic text-stone-400">プレビューはここに表示されます</p>
                  )}
                </div>
              )}
            </div>

            {/* Meta: tags, links, boards */}
            <div className="mt-8 flex flex-wrap items-center gap-2 text-xs">
              {card.tags.map((t) => (
                <Link
                  key={t}
                  href={`/tags/${encodeURIComponent(t)}`}
                  className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-700 hover:bg-amber-200"
                >
                  #{t}
                </Link>
              ))}
              {outgoing.map((o) => (
                <Link
                  key={o.id}
                  href={`/cards/${o.id}`}
                  className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 font-medium text-teal-700 ring-1 ring-teal-200 hover:bg-teal-100"
                >
                  <Link2 size={11} /> {o.title}
                </Link>
              ))}
              {card.boards.map((b) => (
                <Link
                  key={b.id}
                  href={`/whiteboards/${b.id}`}
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-100"
                >
                  <LayoutGrid size={11} /> {b.emoji} {b.name}
                </Link>
              ))}
            </div>

            {/* Backlinks */}
            <section className="mt-10">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
                <Link2 size={13} /> バックリンク
                <span className="rounded-full bg-stone-200 px-1.5 text-[10px] text-stone-600">
                  {card.backlinks.length}
                </span>
              </h3>
              {card.backlinks.length ? (
                <div className="grid grid-cols-2 gap-3">
                  {card.backlinks.map((b) => (
                    <CardTile key={b.id} card={b} />
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-stone-300 p-4 text-center text-xs text-stone-400">
                  他のカードから <code>[[{title}]]</code> と書くとここに表示されます
                </p>
              )}
            </section>

            {card.unlinked.length > 0 && (
              <section className="mt-8">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
                  未リンクの言及
                  <span className="ml-2 rounded-full bg-stone-200 px-1.5 text-[10px] text-stone-600">
                    {card.unlinked.length}
                  </span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {card.unlinked.map((b) => (
                    <CardTile key={b.id} card={b} compact />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

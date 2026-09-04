"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home,
  BookOpen,
  Layers,
  LayoutGrid,
  Tag,
  Share2,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { QuickSearch } from "./QuickSearch";

const nav = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/journal", label: "ジャーナル", icon: BookOpen },
  { href: "/cards", label: "カード", icon: Layers },
  { href: "/whiteboards", label: "ホワイトボード", icon: LayoutGrid },
  { href: "/tags", label: "タグ", icon: Tag },
  { href: "/graph", label: "グラフ", icon: Share2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function newCard() {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "" }),
      });
      const card = await res.json();
      router.push(`/cards/${card.id}?new=1`);
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <aside className="flex w-60 shrink-0 flex-col border-r border-stone-200/80 bg-[#efece5]/80 backdrop-blur">
        <div className="flex items-center gap-2 px-4 pt-5 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="text-[15px] font-bold leading-tight tracking-tight">Nexus</div>
            <div className="text-[10px] uppercase tracking-widest text-stone-500">
              Spatial PKM
            </div>
          </div>
        </div>

        <div className="px-3 pb-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex w-full items-center gap-2 rounded-lg border border-stone-200 bg-white/70 px-3 py-1.5 text-left text-sm text-stone-500 hover:bg-white"
          >
            <Search size={14} />
            <span className="flex-1">検索…</span>
            <kbd className="rounded border border-stone-200 bg-stone-50 px-1 text-[10px] text-stone-400">
              ⌘K
            </kbd>
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-1">
          {nav.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13.5px] transition ${
                  active
                    ? "bg-white font-semibold text-stone-900 shadow-sm"
                    : "text-stone-600 hover:bg-white/60 hover:text-stone-900"
                }`}
              >
                <Icon size={16} className={active ? "text-indigo-600" : "text-stone-400"} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3">
          <button
            onClick={newCard}
            disabled={creating}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-stone-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-stone-700 disabled:opacity-60"
          >
            <Plus size={15} /> 新しいカード
          </button>
          <p className="mt-2 text-center text-[10px] text-stone-400">
            [[リンク]] と #タグ で知識を繋ぐ
          </p>
        </div>
      </aside>
      {searchOpen && <QuickSearch onClose={() => setSearchOpen(false)} />}
    </>
  );
}

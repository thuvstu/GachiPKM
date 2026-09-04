"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Plus } from "lucide-react";

export function CardsToolbar({ initialQuery }: { initialQuery: string }) {
  const [q, setQ] = useState(initialQuery);
  const router = useRouter();

  async function newCard() {
    const res = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "" }),
    });
    const c = await res.json();
    router.push(`/cards/${c.id}?new=1`);
  }

  return (
    <div className="flex items-center gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.push(q ? `/cards?q=${encodeURIComponent(q)}` : "/cards");
        }}
        className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-1.5 shadow-sm"
      >
        <Search size={14} className="text-stone-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="全文検索…"
          className="w-56 bg-transparent text-sm outline-none"
        />
      </form>
      <button
        onClick={newCard}
        className="flex items-center gap-1 rounded-lg bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700"
      >
        <Plus size={14} /> 新規
      </button>
    </div>
  );
}

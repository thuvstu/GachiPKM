import { listCards, listTags } from "@/lib/cards";
import { CardTile } from "@/components/CardTile";
import { CardsToolbar } from "@/components/CardsToolbar";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const { q, tag } = await searchParams;
  const [cards, tags] = await Promise.all([listCards({ q, tag }), listTags()]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-8 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">カード</h1>
            <p className="text-sm text-stone-500">
              {cards.length} 枚{q ? ` — 「${q}」の検索結果` : ""}
              {tag ? ` — #${tag}` : ""}
            </p>
          </div>
          <CardsToolbar initialQuery={q ?? ""} />
        </div>

        {tags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            <Link
              href="/cards"
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                !tag ? "bg-stone-900 text-white ring-stone-900" : "bg-white text-stone-600 ring-stone-200 hover:bg-stone-50"
              }`}
            >
              すべて
            </Link>
            {tags.map((t) => (
              <Link
                key={t.name}
                href={`/cards?tag=${encodeURIComponent(t.name)}`}
                className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                  tag === t.name
                    ? "bg-amber-500 text-white ring-amber-500"
                    : "bg-white text-amber-700 ring-amber-200 hover:bg-amber-50"
                }`}
              >
                #{t.name} <span className="opacity-60">{t.count}</span>
              </Link>
            ))}
          </div>
        )}

        {cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 p-16 text-center text-stone-400">
            カードが見つかりません。左下の「新しいカード」から作成しましょう。
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {cards.map((c) => (
              <CardTile key={c.id} card={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

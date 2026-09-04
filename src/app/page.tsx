import Link from "next/link";
import { ArrowRight, BookOpen, Layers, LayoutGrid, Link2, Tag } from "lucide-react";
import { ensureSeed } from "@/lib/seed";
import { getOrCreateJournal, getStats, listCards } from "@/lib/cards";
import { listWhiteboards } from "@/lib/whiteboards";
import { formatJournalTitle, todayKey, excerpt } from "@/lib/utils";
import { CardTile } from "@/components/CardTile";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureSeed();
  const today = todayKey();
  const [journal, recent, boards, stats] = await Promise.all([
    getOrCreateJournal(today),
    listCards({ limit: 9 }),
    listWhiteboards(),
    getStats(),
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 5 ? "こんばんは" : hour < 11 ? "おはようございます" : hour < 18 ? "こんにちは" : "こんばんは";

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-8 py-10">
        <header className="mb-8">
          <p className="text-sm text-stone-500">{formatJournalTitle(today)}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{greeting}。今日は何を考えますか？</h1>
        </header>

        <div className="mb-10 grid grid-cols-4 gap-3">
          {[
            { label: "カード", value: stats.cards, icon: Layers, href: "/cards" },
            { label: "リンク", value: stats.links, icon: Link2, href: "/graph" },
            { label: "タグ", value: stats.tags, icon: Tag, href: "/tags" },
            { label: "ホワイトボード", value: stats.whiteboards, icon: LayoutGrid, href: "/whiteboards" },
          ].map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:shadow-md"
            >
              <s.icon size={18} className="text-indigo-500" />
              <div>
                <div className="text-xl font-bold leading-none">{s.value}</div>
                <div className="mt-1 text-[11px] text-stone-500">{s.label}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <section className="col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-stone-500">
                <BookOpen size={14} /> 今日のジャーナル
              </h2>
              <Link href="/journal" className="text-xs text-indigo-600 hover:underline">
                すべて見る
              </Link>
            </div>
            <Link
              href={`/cards/${journal.id}`}
              className="block rounded-2xl border border-amber-200 bg-amber-50/70 p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="text-lg font-semibold">{journal.title}</div>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone-600">
                {excerpt(journal.content, 400) || "まだ何も書かれていません。クリックして今日の思考を記録しましょう。"}
              </p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-amber-700">
                書く <ArrowRight size={14} />
              </div>
            </Link>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-stone-500">
                <LayoutGrid size={14} /> ホワイトボード
              </h2>
              <Link href="/whiteboards" className="text-xs text-indigo-600 hover:underline">
                すべて見る
              </Link>
            </div>
            <div className="space-y-2">
              {boards.slice(0, 5).map((b) => (
                <Link
                  key={b.id}
                  href={`/whiteboards/${b.id}`}
                  className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:shadow-md"
                >
                  <span className="text-xl">{b.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{b.name}</div>
                    <div className="text-[11px] text-stone-400">{b.nodeCount} カード</div>
                  </div>
                </Link>
              ))}
              {boards.length === 0 && (
                <p className="rounded-xl border border-dashed border-stone-300 p-4 text-center text-xs text-stone-400">
                  まだホワイトボードがありません
                </p>
              )}
            </div>
          </section>
        </div>

        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-stone-500">
              <Layers size={14} /> 最近のカード
            </h2>
            <Link href="/cards" className="text-xs text-indigo-600 hover:underline">
              すべて見る
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {recent.map((c) => (
              <CardTile key={c.id} card={c} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

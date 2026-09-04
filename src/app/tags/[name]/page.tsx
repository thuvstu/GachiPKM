import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listCards } from "@/lib/cards";
import { CardTile } from "@/components/CardTile";

export const dynamic = "force-dynamic";

export default async function TagPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const tag = decodeURIComponent(name);
  const cards = await listCards({ tag });

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-8 py-8">
        <Link href="/tags" className="mb-3 inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800">
          <ArrowLeft size={12} /> タグ一覧
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-amber-500">#</span>
          {tag}
        </h1>
        <p className="mb-6 text-sm text-stone-500">{cards.length} 枚のカード</p>
        <div className="grid grid-cols-3 gap-4">
          {cards.map((c) => (
            <CardTile key={c.id} card={c} />
          ))}
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Tag } from "lucide-react";
import { listTags } from "@/lib/cards";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const tags = await listTags();
  const max = Math.max(1, ...tags.map((t) => t.count));

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-8 py-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Tag className="text-amber-500" size={22} /> タグ
        </h1>
        <p className="mb-8 text-sm text-stone-500">
          カード本文に <code className="rounded bg-stone-200 px-1">#タグ</code> と書くと自動で集約されます。
        </p>
        {tags.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 p-12 text-center text-stone-400">
            まだタグがありません
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {tags.map((t) => {
              const scale = 0.85 + (t.count / max) * 0.9;
              return (
                <Link
                  key={t.name}
                  href={`/tags/${encodeURIComponent(t.name)}`}
                  style={{ fontSize: `${scale}rem` }}
                  className="rounded-full border border-amber-200 bg-white px-4 py-1.5 font-medium text-amber-800 shadow-sm transition hover:bg-amber-50 hover:shadow"
                >
                  #{t.name} <span className="ml-1 text-xs text-stone-400">{t.count}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { BookOpen, Pin } from "lucide-react";
import { colorClasses, excerpt, relativeTime } from "@/lib/utils";

export type TileCard = {
  id: string;
  title: string;
  content: string;
  color: string;
  isJournal: boolean;
  pinned?: boolean;
  updatedAt: Date | string;
  tags?: string[];
};

export function CardTile({ card, compact = false }: { card: TileCard; compact?: boolean }) {
  return (
    <Link
      href={`/cards/${card.id}`}
      className={`group flex flex-col rounded-xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${colorClasses(
        card.color,
      )}`}
    >
      <div className="flex items-start gap-2">
        {card.isJournal && <BookOpen size={14} className="mt-1 shrink-0 text-amber-600" />}
        <h3 className="line-clamp-2 flex-1 text-[15px] font-semibold leading-snug tracking-tight text-stone-900">
          {card.title}
        </h3>
        {card.pinned && <Pin size={13} className="mt-1 shrink-0 text-indigo-500" />}
      </div>
      {!compact && (
        <p className="mt-2 line-clamp-4 flex-1 text-[13px] leading-relaxed text-stone-600">
          {excerpt(card.content, 200) || <span className="italic text-stone-400">空のカード</span>}
        </p>
      )}
      <div className="mt-3 flex items-center gap-2 text-[11px] text-stone-400">
        <span>{relativeTime(card.updatedAt)}</span>
        <span className="flex flex-1 flex-wrap justify-end gap-1">
          {card.tags?.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200"
            >
              #{t}
            </span>
          ))}
        </span>
      </div>
    </Link>
  );
}

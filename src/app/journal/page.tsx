import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { getOrCreateJournal, listJournals } from "@/lib/cards";
import { excerpt, todayKey } from "@/lib/utils";
import { JournalDatePicker } from "@/components/JournalDatePicker";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const today = todayKey();
  await getOrCreateJournal(today);
  const journals = await listJournals(60);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-8 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <BookOpen className="text-amber-500" size={22} /> ジャーナル
            </h1>
            <p className="text-sm text-stone-500">毎日の思考の入口。気づきはカードに切り出そう。</p>
          </div>
          <JournalDatePicker />
        </div>

        <ol className="relative space-y-4 border-l border-stone-200 pl-6">
          {journals.map((j) => (
            <li key={j.id} className="relative">
              <span
                className={`absolute -left-[31px] top-4 h-2.5 w-2.5 rounded-full ring-4 ring-[#f7f5f0] ${
                  j.journalDate === today ? "bg-amber-500" : "bg-stone-300"
                }`}
              />
              <Link
                href={`/cards/${j.id}`}
                className={`group block rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
                  j.journalDate === today
                    ? "border-amber-200 bg-amber-50/70"
                    : "border-stone-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">{j.title}</h2>
                  <ChevronRight size={16} className="text-stone-300 group-hover:text-stone-500" />
                </div>
                <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-stone-600">
                  {excerpt(j.content, 300) || (
                    <span className="italic text-stone-400">まだ何も書かれていません</span>
                  )}
                </p>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

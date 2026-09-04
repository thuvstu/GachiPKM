import { redirect } from "next/navigation";
import { createCard, getCardByTitle } from "@/lib/cards";

export const dynamic = "force-dynamic";

export default async function NewCardPage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string }>;
}) {
  const { title } = await searchParams;
  const t = (title ?? "").trim();
  if (t) {
    const existing = await getCardByTitle(t);
    if (existing) redirect(`/cards/${existing.id}`);
  }
  const card = await createCard({ title: t });
  redirect(`/cards/${card.id}?new=1`);
}

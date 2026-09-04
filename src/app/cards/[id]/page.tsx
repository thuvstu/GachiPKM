import { notFound } from "next/navigation";
import { getCard } from "@/lib/cards";
import { CardEditor } from "@/components/CardEditor";

export const dynamic = "force-dynamic";

export default async function CardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { id } = await params;
  const { new: isNew } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const card = await getCard(id);
  if (!card) notFound();
  return (
    <CardEditor
      key={card.id + card.updatedAt.toISOString()}
      card={JSON.parse(JSON.stringify(card))}
      autoFocusTitle={isNew === "1"}
    />
  );
}

import { notFound } from "next/navigation";
import { getWhiteboard } from "@/lib/whiteboards";
import { WhiteboardCanvas } from "@/components/whiteboard/WhiteboardCanvas";

export const dynamic = "force-dynamic";

export default async function WhiteboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const board = await getWhiteboard(id);
  if (!board) notFound();
  return <WhiteboardCanvas board={JSON.parse(JSON.stringify(board))} />;
}

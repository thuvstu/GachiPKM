import { NextResponse } from "next/server";
import { deleteCard, getCard, updateCard } from "@/lib/cards";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const card = await getCard(id);
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(card);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const updated = await updateCard(id, {
    title: body.title,
    content: body.content,
    color: body.color,
    pinned: body.pinned,
  });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

// sendBeacon fallback (flush unsaved edits on navigation)
export const POST = PATCH;

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  await deleteCard(id);
  return NextResponse.json({ ok: true });
}

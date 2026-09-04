import { NextResponse } from "next/server";
import { deleteWhiteboard, getWhiteboard, updateWhiteboard } from "@/lib/whiteboards";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const board = await getWhiteboard(id);
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(board);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const b = await updateWhiteboard(id, {
    name: body.name,
    description: body.description,
    emoji: body.emoji,
  });
  if (!b) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(b);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  await deleteWhiteboard(id);
  return NextResponse.json({ ok: true });
}

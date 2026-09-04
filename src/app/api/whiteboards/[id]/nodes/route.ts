import { NextResponse } from "next/server";
import { addNode, updateNodes } from "@/lib/whiteboards";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const node = await addNode(id, {
    cardId: body.cardId,
    title: body.title,
    content: body.content,
    color: body.color,
    x: Number(body.x ?? 0),
    y: Number(body.y ?? 0),
    width: body.width,
    height: body.height,
  });
  return NextResponse.json(node, { status: 201 });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const updates = Array.isArray(body.updates) ? body.updates : [];
  await updateNodes(id, updates);
  return NextResponse.json({ ok: true });
}

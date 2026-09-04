import { NextResponse } from "next/server";
import { removeEdge, updateEdge } from "@/lib/whiteboards";

type Ctx = { params: Promise<{ id: string; edgeId: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id, edgeId } = await params;
  const body = await req.json().catch(() => ({}));
  const e = await updateEdge(id, edgeId, { label: body.label ?? "" });
  if (!e) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(e);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id, edgeId } = await params;
  await removeEdge(id, edgeId);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { removeNode } from "@/lib/whiteboards";

type Ctx = { params: Promise<{ id: string; nodeId: string }> };

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id, nodeId } = await params;
  await removeNode(id, nodeId);
  return NextResponse.json({ ok: true });
}

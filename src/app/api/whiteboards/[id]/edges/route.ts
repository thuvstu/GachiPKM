import { NextResponse } from "next/server";
import { addEdge } from "@/lib/whiteboards";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (!body.sourceNodeId || !body.targetNodeId) {
    return NextResponse.json({ error: "sourceNodeId and targetNodeId required" }, { status: 400 });
  }
  const edge = await addEdge(id, {
    sourceNodeId: body.sourceNodeId,
    targetNodeId: body.targetNodeId,
    sourceHandle: body.sourceHandle ?? null,
    targetHandle: body.targetHandle ?? null,
    label: body.label,
  });
  return NextResponse.json(edge, { status: 201 });
}

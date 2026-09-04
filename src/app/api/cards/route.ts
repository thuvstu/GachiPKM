import { NextResponse } from "next/server";
import { createCard, listCards } from "@/lib/cards";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const tag = searchParams.get("tag") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? 200);
  const rows = await listCards({ q, tag, limit });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const card = await createCard({
    title: body.title,
    content: body.content,
    color: body.color,
  });
  return NextResponse.json(card, { status: 201 });
}

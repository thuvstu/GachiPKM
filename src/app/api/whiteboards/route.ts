import { NextResponse } from "next/server";
import { createWhiteboard, listWhiteboards } from "@/lib/whiteboards";

export async function GET() {
  return NextResponse.json(await listWhiteboards());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const b = await createWhiteboard({
    name: body.name,
    description: body.description,
    emoji: body.emoji,
  });
  return NextResponse.json(b, { status: 201 });
}

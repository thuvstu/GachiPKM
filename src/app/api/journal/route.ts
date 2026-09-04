import { NextResponse } from "next/server";
import { getOrCreateJournal, listJournals } from "@/lib/cards";
import { todayKey } from "@/lib/utils";

export async function GET() {
  return NextResponse.json(await listJournals());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const date: string = /^\d{4}-\d{2}-\d{2}$/.test(body.date ?? "") ? body.date : todayKey();
  const card = await getOrCreateJournal(date);
  return NextResponse.json(card, { status: 201 });
}

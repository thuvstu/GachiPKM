"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { todayKey } from "@/lib/utils";

export function JournalDatePicker() {
  const [date, setDate] = useState(todayKey());
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function open() {
    setBusy(true);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      const c = await res.json();
      router.push(`/cards/${c.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-2 py-1 shadow-sm">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="bg-transparent text-sm outline-none"
      />
      <button
        onClick={open}
        disabled={busy}
        className="flex items-center gap-1 rounded-md bg-amber-500 px-2 py-1 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
      >
        <CalendarPlus size={13} /> 開く
      </button>
    </div>
  );
}

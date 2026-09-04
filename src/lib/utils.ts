export const CARD_COLORS = [
  { key: "white", label: "白", bg: "bg-white", border: "border-stone-200", swatch: "#ffffff" },
  { key: "yellow", label: "黄", bg: "bg-amber-50", border: "border-amber-200", swatch: "#fef3c7" },
  { key: "green", label: "緑", bg: "bg-emerald-50", border: "border-emerald-200", swatch: "#d1fae5" },
  { key: "blue", label: "青", bg: "bg-sky-50", border: "border-sky-200", swatch: "#e0f2fe" },
  { key: "purple", label: "紫", bg: "bg-violet-50", border: "border-violet-200", swatch: "#ede9fe" },
  { key: "pink", label: "桃", bg: "bg-pink-50", border: "border-pink-200", swatch: "#fce7f3" },
  { key: "red", label: "赤", bg: "bg-rose-50", border: "border-rose-200", swatch: "#ffe4e6" },
  { key: "gray", label: "灰", bg: "bg-stone-100", border: "border-stone-300", swatch: "#f5f5f4" },
] as const;

export type CardColor = (typeof CARD_COLORS)[number]["key"];

export function colorClasses(color: string) {
  const c = CARD_COLORS.find((x) => x.key === color) ?? CARD_COLORS[0];
  return `${c.bg} ${c.border}`;
}

export function colorSwatch(color: string) {
  return (CARD_COLORS.find((x) => x.key === color) ?? CARD_COLORS[0]).swatch;
}

export const WIKILINK_RE = /\[\[([^\[\]\n]+?)\]\]/g;
export const HASHTAG_RE = /(^|[\s(（「])#([^\s#\[\]()（）「」、。,.!?！？]+)/g;

export function extractWikilinks(content: string): string[] {
  const set = new Set<string>();
  for (const m of content.matchAll(WIKILINK_RE)) {
    const t = m[1].split("|")[0].trim();
    if (t) set.add(t);
  }
  return [...set];
}

export function extractHashtags(content: string): string[] {
  const set = new Set<string>();
  for (const m of content.matchAll(HASHTAG_RE)) {
    const t = m[2].trim().toLowerCase();
    if (t && !/^\d+$/.test(t)) set.add(t);
  }
  return [...set];
}

export function excerpt(content: string, len = 140): string {
  const plain = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_>~-]{1,3}/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > len ? plain.slice(0, len) + "…" : plain;
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatJournalTitle(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const wd = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
  return `${y}年${m}月${d}日 (${wd})`;
}

export function relativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}時間前`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}日前`;
  return d.toLocaleDateString("ja-JP");
}

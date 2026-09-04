import { db } from "@/db";
import {
  cards,
  cardLinks,
  cardTags,
  tags,
  whiteboardNodes,
  whiteboards,
  type Card,
} from "@/db/schema";
import { and, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { extractHashtags, extractWikilinks, formatJournalTitle } from "./utils";

export type CardSummary = Card & { tags: string[] };

// ---------- Queries ----------
export async function listCards(opts: { q?: string; tag?: string; limit?: number } = {}) {
  const { q, tag, limit = 500 } = opts;
  const conditions = [];
  if (q && q.trim()) {
    const like = `%${q.trim()}%`;
    conditions.push(or(ilike(cards.title, like), ilike(cards.content, like)));
  }
  let ids: string[] | null = null;
  if (tag) {
    const rows = await db
      .select({ cardId: cardTags.cardId })
      .from(cardTags)
      .innerJoin(tags, eq(tags.id, cardTags.tagId))
      .where(eq(tags.name, tag.toLowerCase()));
    ids = rows.map((r) => r.cardId);
    if (ids.length === 0) return [] as CardSummary[];
    conditions.push(inArray(cards.id, ids));
  }
  const rows = await db
    .select()
    .from(cards)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(cards.pinned), desc(cards.updatedAt))
    .limit(limit);
  return attachTags(rows);
}

export async function attachTags(rows: Card[]): Promise<CardSummary[]> {
  if (rows.length === 0) return [];
  const tagRows = await db
    .select({ cardId: cardTags.cardId, name: tags.name })
    .from(cardTags)
    .innerJoin(tags, eq(tags.id, cardTags.tagId))
    .where(
      inArray(
        cardTags.cardId,
        rows.map((r) => r.id),
      ),
    );
  const map = new Map<string, string[]>();
  for (const t of tagRows) {
    map.set(t.cardId, [...(map.get(t.cardId) ?? []), t.name]);
  }
  return rows.map((r) => ({ ...r, tags: (map.get(r.id) ?? []).sort() }));
}

export async function getCard(id: string) {
  const [card] = await db.select().from(cards).where(eq(cards.id, id));
  if (!card) return null;
  const [withTags] = await attachTags([card]);

  const outgoing = await db
    .select({ id: cards.id, title: cards.title, color: cards.color })
    .from(cardLinks)
    .innerJoin(cards, eq(cards.id, cardLinks.targetId))
    .where(eq(cardLinks.sourceId, id));

  const backlinkRows = await db
    .select()
    .from(cardLinks)
    .innerJoin(cards, eq(cards.id, cardLinks.sourceId))
    .where(eq(cardLinks.targetId, id))
    .orderBy(desc(cards.updatedAt));
  const backlinks = await attachTags(backlinkRows.map((r) => r.cards));

  const boards = await db
    .select({ id: whiteboards.id, name: whiteboards.name, emoji: whiteboards.emoji })
    .from(whiteboardNodes)
    .innerJoin(whiteboards, eq(whiteboards.id, whiteboardNodes.whiteboardId))
    .where(eq(whiteboardNodes.cardId, id));

  // Unlinked mentions: cards that mention this title in text without a link
  const unlinked = card.title.trim()
    ? await db
        .select()
        .from(cards)
        .where(
          and(
            ne(cards.id, id),
            ilike(cards.content, `%${card.title}%`),
            sql`${cards.id} NOT IN (SELECT source_id FROM card_links WHERE target_id = ${id})`,
          ),
        )
        .limit(20)
    : [];

  return { ...withTags, outgoing, backlinks, boards, unlinked: await attachTags(unlinked) };
}

export type CardDetail = NonNullable<Awaited<ReturnType<typeof getCard>>>;

export async function getCardByTitle(title: string) {
  const [c] = await db
    .select()
    .from(cards)
    .where(ilike(cards.title, title.trim()))
    .limit(1);
  return c ?? null;
}

// ---------- Mutations ----------
export async function createCard(input: {
  title?: string;
  content?: string;
  color?: string;
  isJournal?: boolean;
  journalDate?: string | null;
}) {
  const [created] = await db
    .insert(cards)
    .values({
      title: input.title?.trim() || "無題のカード",
      content: input.content ?? "",
      color: input.color ?? "white",
      isJournal: input.isJournal ?? false,
      journalDate: input.journalDate ?? null,
    })
    .returning();
  await syncRelations(created.id, created.content);
  return created;
}

export async function updateCard(
  id: string,
  patch: { title?: string; content?: string; color?: string; pinned?: boolean },
) {
  const values: Partial<typeof cards.$inferInsert> = { updatedAt: new Date() };
  if (patch.title !== undefined) values.title = patch.title.trim() || "無題のカード";
  if (patch.content !== undefined) values.content = patch.content;
  if (patch.color !== undefined) values.color = patch.color;
  if (patch.pinned !== undefined) values.pinned = patch.pinned;
  const [updated] = await db.update(cards).set(values).where(eq(cards.id, id)).returning();
  if (!updated) return null;
  if (patch.content !== undefined) await syncRelations(id, updated.content);
  return updated;
}

export async function deleteCard(id: string) {
  await db.delete(cards).where(eq(cards.id, id));
}

/**
 * Parse [[wikilinks]] and #hashtags in content, and sync the link/tag tables.
 * Linked cards that don't exist yet are created automatically (Heptabase-style).
 */
export async function syncRelations(cardId: string, content: string) {
  // --- Links ---
  const titles = extractWikilinks(content);
  const targetIds: string[] = [];
  for (const title of titles) {
    let target = await getCardByTitle(title);
    if (!target) {
      [target] = await db.insert(cards).values({ title, content: "" }).returning();
    }
    if (target.id !== cardId) targetIds.push(target.id);
  }
  await db.delete(cardLinks).where(eq(cardLinks.sourceId, cardId));
  if (targetIds.length) {
    await db
      .insert(cardLinks)
      .values([...new Set(targetIds)].map((targetId) => ({ sourceId: cardId, targetId })))
      .onConflictDoNothing();
  }

  // --- Tags ---
  const names = extractHashtags(content);
  await db.delete(cardTags).where(eq(cardTags.cardId, cardId));
  if (names.length) {
    await db
      .insert(tags)
      .values(names.map((name) => ({ name })))
      .onConflictDoNothing();
    const tagRows = await db.select().from(tags).where(inArray(tags.name, names));
    await db
      .insert(cardTags)
      .values(tagRows.map((t) => ({ cardId, tagId: t.id })))
      .onConflictDoNothing();
  }
  // Remove orphan tags
  await db.execute(
    sql`DELETE FROM tags WHERE id NOT IN (SELECT DISTINCT tag_id FROM card_tags)`,
  );
}

// ---------- Journal ----------
export async function getOrCreateJournal(dateKey: string) {
  const [existing] = await db.select().from(cards).where(eq(cards.journalDate, dateKey));
  if (existing) return existing;
  const [created] = await db
    .insert(cards)
    .values({
      title: formatJournalTitle(dateKey),
      content: "",
      isJournal: true,
      journalDate: dateKey,
      color: "yellow",
    })
    .onConflictDoNothing()
    .returning();
  if (created) return created;
  const [again] = await db.select().from(cards).where(eq(cards.journalDate, dateKey));
  return again;
}

export async function listJournals(limit = 30) {
  return db
    .select()
    .from(cards)
    .where(eq(cards.isJournal, true))
    .orderBy(desc(cards.journalDate))
    .limit(limit);
}

// ---------- Tags ----------
export async function listTags() {
  const rows = await db
    .select({ name: tags.name, count: sql<number>`count(${cardTags.cardId})::int` })
    .from(tags)
    .leftJoin(cardTags, eq(cardTags.tagId, tags.id))
    .groupBy(tags.name)
    .orderBy(desc(sql`count(${cardTags.cardId})`), tags.name);
  return rows;
}

// ---------- Graph ----------
export async function getGraph() {
  const nodes = await db
    .select({ id: cards.id, title: cards.title, color: cards.color, isJournal: cards.isJournal })
    .from(cards);
  const edges = await db.select().from(cardLinks);
  return { nodes, edges };
}

// ---------- Stats ----------
export async function getStats() {
  const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(cards);
  const [l] = await db.select({ n: sql<number>`count(*)::int` }).from(cardLinks);
  const [t] = await db.select({ n: sql<number>`count(*)::int` }).from(tags);
  const [w] = await db.select({ n: sql<number>`count(*)::int` }).from(whiteboards);
  return { cards: c.n, links: l.n, tags: t.n, whiteboards: w.n };
}

import { db } from "@/db";
import { cards, whiteboardEdges, whiteboardNodes, whiteboards } from "@/db/schema";
import { desc, eq, sql, and } from "drizzle-orm";
import { createCard } from "./cards";

export async function listWhiteboards() {
  const rows = await db
    .select({
      id: whiteboards.id,
      name: whiteboards.name,
      description: whiteboards.description,
      emoji: whiteboards.emoji,
      createdAt: whiteboards.createdAt,
      updatedAt: whiteboards.updatedAt,
      nodeCount: sql<number>`(SELECT count(*)::int FROM whiteboard_nodes n WHERE n.whiteboard_id = ${whiteboards.id})`,
    })
    .from(whiteboards)
    .orderBy(desc(whiteboards.updatedAt));
  return rows;
}

export async function getWhiteboard(id: string) {
  const [board] = await db.select().from(whiteboards).where(eq(whiteboards.id, id));
  if (!board) return null;
  const nodeRows = await db
    .select({
      id: whiteboardNodes.id,
      x: whiteboardNodes.x,
      y: whiteboardNodes.y,
      width: whiteboardNodes.width,
      height: whiteboardNodes.height,
      card: {
        id: cards.id,
        title: cards.title,
        content: cards.content,
        color: cards.color,
        isJournal: cards.isJournal,
        updatedAt: cards.updatedAt,
      },
    })
    .from(whiteboardNodes)
    .innerJoin(cards, eq(cards.id, whiteboardNodes.cardId))
    .where(eq(whiteboardNodes.whiteboardId, id));
  const edgeRows = await db
    .select()
    .from(whiteboardEdges)
    .where(eq(whiteboardEdges.whiteboardId, id));
  return { ...board, nodes: nodeRows, edges: edgeRows };
}

export type WhiteboardDetail = NonNullable<Awaited<ReturnType<typeof getWhiteboard>>>;
export type BoardNode = WhiteboardDetail["nodes"][number];
export type BoardEdge = WhiteboardDetail["edges"][number];

export async function createWhiteboard(input: { name?: string; description?: string; emoji?: string }) {
  const [b] = await db
    .insert(whiteboards)
    .values({
      name: input.name?.trim() || "新しいホワイトボード",
      description: input.description ?? "",
      emoji: input.emoji ?? "🗺️",
    })
    .returning();
  return b;
}

export async function updateWhiteboard(
  id: string,
  patch: { name?: string; description?: string; emoji?: string },
) {
  const [b] = await db
    .update(whiteboards)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(whiteboards.id, id))
    .returning();
  return b ?? null;
}

export async function deleteWhiteboard(id: string) {
  await db.delete(whiteboards).where(eq(whiteboards.id, id));
}

export async function touchBoard(id: string) {
  await db.update(whiteboards).set({ updatedAt: new Date() }).where(eq(whiteboards.id, id));
}

export async function addNode(
  boardId: string,
  input: {
    cardId?: string;
    title?: string;
    content?: string;
    color?: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
  },
) {
  let cardId = input.cardId;
  if (!cardId) {
    const c = await createCard({ title: input.title, content: input.content, color: input.color });
    cardId = c.id;
  }
  const [node] = await db
    .insert(whiteboardNodes)
    .values({
      whiteboardId: boardId,
      cardId,
      x: input.x,
      y: input.y,
      width: input.width ?? 280,
      height: input.height ?? 180,
    })
    .returning();
  await touchBoard(boardId);
  const [card] = await db.select().from(cards).where(eq(cards.id, cardId));
  return { ...node, card };
}

export async function updateNodes(
  boardId: string,
  updates: { id: string; x?: number; y?: number; width?: number; height?: number }[],
) {
  for (const u of updates) {
    const values: Partial<typeof whiteboardNodes.$inferInsert> = {};
    if (u.x !== undefined) values.x = u.x;
    if (u.y !== undefined) values.y = u.y;
    if (u.width !== undefined) values.width = Math.round(u.width);
    if (u.height !== undefined) values.height = Math.round(u.height);
    if (Object.keys(values).length === 0) continue;
    await db
      .update(whiteboardNodes)
      .set(values)
      .where(and(eq(whiteboardNodes.id, u.id), eq(whiteboardNodes.whiteboardId, boardId)));
  }
  await touchBoard(boardId);
}

export async function removeNode(boardId: string, nodeId: string) {
  await db
    .delete(whiteboardNodes)
    .where(and(eq(whiteboardNodes.id, nodeId), eq(whiteboardNodes.whiteboardId, boardId)));
  await touchBoard(boardId);
}

export async function addEdge(
  boardId: string,
  input: {
    sourceNodeId: string;
    targetNodeId: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    label?: string;
  },
) {
  const [e] = await db
    .insert(whiteboardEdges)
    .values({
      whiteboardId: boardId,
      sourceNodeId: input.sourceNodeId,
      targetNodeId: input.targetNodeId,
      sourceHandle: input.sourceHandle ?? null,
      targetHandle: input.targetHandle ?? null,
      label: input.label ?? "",
    })
    .returning();
  await touchBoard(boardId);
  return e;
}

export async function updateEdge(boardId: string, edgeId: string, patch: { label?: string }) {
  const [e] = await db
    .update(whiteboardEdges)
    .set(patch)
    .where(and(eq(whiteboardEdges.id, edgeId), eq(whiteboardEdges.whiteboardId, boardId)))
    .returning();
  return e ?? null;
}

export async function removeEdge(boardId: string, edgeId: string) {
  await db
    .delete(whiteboardEdges)
    .where(and(eq(whiteboardEdges.id, edgeId), eq(whiteboardEdges.whiteboardId, boardId)));
  await touchBoard(boardId);
}

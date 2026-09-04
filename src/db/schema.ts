import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  real,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------- Cards (the atomic unit of knowledge) ----------
export const cards = pgTable(
  "cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    content: text("content").notNull().default(""),
    color: text("color").notNull().default("white"),
    isJournal: boolean("is_journal").notNull().default(false),
    journalDate: text("journal_date"), // YYYY-MM-DD
    pinned: boolean("pinned").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("cards_journal_date_idx").on(t.journalDate),
    index("cards_title_idx").on(t.title),
    index("cards_updated_idx").on(t.updatedAt),
  ],
);

// ---------- Tags ----------
export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cardTags = pgTable(
  "card_tags",
  {
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.cardId, t.tagId] })],
);

// ---------- Links ([[wikilinks]] between cards) ----------
export const cardLinks = pgTable(
  "card_links",
  {
    sourceId: uuid("source_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    targetId: uuid("target_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.sourceId, t.targetId] })],
);

// ---------- Whiteboards (spatial thinking canvases) ----------
export const whiteboards = pgTable("whiteboards", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  emoji: text("emoji").notNull().default("🗺️"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const whiteboardNodes = pgTable(
  "whiteboard_nodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    whiteboardId: uuid("whiteboard_id")
      .notNull()
      .references(() => whiteboards.id, { onDelete: "cascade" }),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    x: real("x").notNull().default(0),
    y: real("y").notNull().default(0),
    width: integer("width").notNull().default(280),
    height: integer("height").notNull().default(180),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("wb_nodes_board_idx").on(t.whiteboardId)],
);

export const whiteboardEdges = pgTable(
  "whiteboard_edges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    whiteboardId: uuid("whiteboard_id")
      .notNull()
      .references(() => whiteboards.id, { onDelete: "cascade" }),
    sourceNodeId: uuid("source_node_id")
      .notNull()
      .references(() => whiteboardNodes.id, { onDelete: "cascade" }),
    targetNodeId: uuid("target_node_id")
      .notNull()
      .references(() => whiteboardNodes.id, { onDelete: "cascade" }),
    sourceHandle: text("source_handle"),
    targetHandle: text("target_handle"),
    label: text("label").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("wb_edges_board_idx").on(t.whiteboardId)],
);

// ---------- Relations ----------
export const cardsRelations = relations(cards, ({ many }) => ({
  cardTags: many(cardTags),
  outgoing: many(cardLinks, { relationName: "outgoing" }),
  incoming: many(cardLinks, { relationName: "incoming" }),
  nodes: many(whiteboardNodes),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  cardTags: many(cardTags),
}));

export const cardTagsRelations = relations(cardTags, ({ one }) => ({
  card: one(cards, { fields: [cardTags.cardId], references: [cards.id] }),
  tag: one(tags, { fields: [cardTags.tagId], references: [tags.id] }),
}));

export const cardLinksRelations = relations(cardLinks, ({ one }) => ({
  source: one(cards, {
    fields: [cardLinks.sourceId],
    references: [cards.id],
    relationName: "outgoing",
  }),
  target: one(cards, {
    fields: [cardLinks.targetId],
    references: [cards.id],
    relationName: "incoming",
  }),
}));

export const whiteboardsRelations = relations(whiteboards, ({ many }) => ({
  nodes: many(whiteboardNodes),
  edges: many(whiteboardEdges),
}));

export const whiteboardNodesRelations = relations(whiteboardNodes, ({ one }) => ({
  whiteboard: one(whiteboards, {
    fields: [whiteboardNodes.whiteboardId],
    references: [whiteboards.id],
  }),
  card: one(cards, { fields: [whiteboardNodes.cardId], references: [cards.id] }),
}));

export type Card = typeof cards.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Whiteboard = typeof whiteboards.$inferSelect;
export type WhiteboardNode = typeof whiteboardNodes.$inferSelect;
export type WhiteboardEdge = typeof whiteboardEdges.$inferSelect;

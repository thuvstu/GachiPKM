import { db } from "@/db";
import { cards } from "@/db/schema";
import { sql } from "drizzle-orm";
import { createCard, getOrCreateJournal, updateCard } from "./cards";
import { addEdge, addNode, createWhiteboard } from "./whiteboards";
import { todayKey } from "./utils";

let seeded = false;

/** Insert a small starter knowledge base on first run so the app isn't empty. */
export async function ensureSeed() {
  if (seeded) return;
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(cards);
  if (n > 0) {
    seeded = true;
    return;
  }

  const zettel = await createCard({
    title: "Zettelkasten",
    color: "yellow",
    content: `# Zettelkasten

ドイツの社会学者ニクラス・ルーマンが用いたノート術。**1枚のカードに1つのアイデア**を書き、カード同士をリンクさせて思考のネットワークを育てる。

## 原則
- 自分の言葉で書く（[[アトミックノート]]）
- 既存のカードと必ず接続する
- タグより **リンク** を優先する

関連: [[知識の複利効果]] [[ホワイトボード思考法]]

#pkm #ノート術`,
  });

  const atomic = await createCard({
    title: "アトミックノート",
    color: "blue",
    content: `# アトミックノート

1つのカード = 1つの主張。小さく分けるほど再利用しやすくなり、意外な組み合わせが生まれる。

> 「小さく書け、そして繋げ」

[[Zettelkasten]] の中核的な実践。#pkm #ノート術`,
  });

  const compound = await createCard({
    title: "知識の複利効果",
    color: "green",
    content: `# 知識の複利効果

ノートを書くだけでは知識は増えない。**繋がりの数**が増えると理解が指数関数的に深まる。

- 10枚のカード → 45通りの組み合わせ
- 100枚のカード → 4,950通り

[[Zettelkasten]] を続けるモチベーションはここにある。#思考法`,
  });

  const spatial = await createCard({
    title: "ホワイトボード思考法",
    color: "purple",
    content: `# ホワイトボード思考法

カードを**空間に配置**することで、文章だけでは見えない構造が浮かび上がる。

1. カードを広げる
2. 近いものを寄せる
3. 矢印で因果を描く
4. クラスタに名前をつける → 新しいカードになる

[[アトミックノート]] を素材に、[[知識の複利効果]] を最大化する方法。#思考法 #pkm`,
  });

  const howto = await createCard({
    title: "このアプリの使い方",
    color: "pink",
    content: `# このアプリの使い方 🚀

Heptabase を超えることを目指した **PKM (Personal Knowledge Management)** アプリです。

## カード
- \`[[カード名]]\` と書くとリンクになり、存在しなければ自動で作成されます
- \`#タグ\` と書くと自動でタグ付けされます
- カード下部に **バックリンク** と **未リンクの言及** が表示されます

## ホワイトボード
- カードを無限キャンバスに配置し、ドラッグで並べ替え
- ノードの端をドラッグして **矢印で接続**
- ダブルクリックで矢印にラベルを付与
- 右パネルでカードをその場で編集

## ジャーナル
- 毎日の記録を自動で作成。日々の気づきをカードに切り出そう

## グラフ
- 全カードの繋がりを俯瞰

関連: [[Zettelkasten]] #ヘルプ`,
  });

  const journal = await getOrCreateJournal(todayKey());
  await updateCard(journal.id, {
    content: `## 今日のメモ

- [[このアプリの使い方]] を読んだ
- [[Zettelkasten]] のホワイトボードを整理する

#ジャーナル`,
  });

  const board = await createWhiteboard({
    name: "PKM の全体像",
    emoji: "🧠",
    description: "知識管理の考え方を空間的に整理したボード",
  });
  const n1 = await addNode(board.id, { cardId: zettel.id, x: 0, y: 0, width: 320, height: 220 });
  const n2 = await addNode(board.id, { cardId: atomic.id, x: 440, y: -160, width: 280, height: 180 });
  const n3 = await addNode(board.id, { cardId: compound.id, x: 440, y: 120, width: 280, height: 180 });
  const n4 = await addNode(board.id, { cardId: spatial.id, x: 860, y: -20, width: 300, height: 200 });
  const n5 = await addNode(board.id, { cardId: howto.id, x: -60, y: 320, width: 340, height: 220 });
  await addEdge(board.id, { sourceNodeId: n1.id, targetNodeId: n2.id, label: "実践" });
  await addEdge(board.id, { sourceNodeId: n1.id, targetNodeId: n3.id, label: "効果" });
  await addEdge(board.id, { sourceNodeId: n2.id, targetNodeId: n4.id, label: "素材" });
  await addEdge(board.id, { sourceNodeId: n3.id, targetNodeId: n4.id, label: "最大化" });
  await addEdge(board.id, { sourceNodeId: n5.id, targetNodeId: n1.id });

  seeded = true;
}

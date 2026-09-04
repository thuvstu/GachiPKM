"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import { Share2 } from "lucide-react";
import { colorSwatch } from "@/lib/utils";

type GNode = { id: string; title: string; color: string; isJournal: boolean };
type GEdge = { sourceId: string; targetId: string };

/** Tiny deterministic force-directed layout (no deps). */
function layout(nodes: GNode[], edges: GEdge[]) {
  const n = nodes.length;
  const idx = new Map(nodes.map((x, i) => [x.id, i]));
  const pos = nodes.map((_, i) => {
    const a = (i / Math.max(1, n)) * Math.PI * 2;
    const r = 120 + Math.sqrt(n) * 60;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  });
  const vel = nodes.map(() => ({ x: 0, y: 0 }));
  const links = edges
    .map((e) => [idx.get(e.sourceId), idx.get(e.targetId)] as const)
    .filter((l): l is readonly [number, number] => l[0] !== undefined && l[1] !== undefined);
  const degree = new Array(n).fill(0);
  links.forEach(([a, b]) => {
    degree[a]++;
    degree[b]++;
  });

  const iterations = Math.min(400, 120 + n * 4);
  for (let it = 0; it < iterations; it++) {
    const alpha = 1 - it / iterations;
    // repulsion
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = pos[j].x - pos[i].x;
        let dy = pos[j].y - pos[i].y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) {
          dx = Math.random() - 0.5;
          dy = Math.random() - 0.5;
          d2 = 1;
        }
        const f = (9000 * alpha) / d2;
        const d = Math.sqrt(d2);
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        vel[i].x -= fx;
        vel[i].y -= fy;
        vel[j].x += fx;
        vel[j].y += fy;
      }
    }
    // attraction
    for (const [a, b] of links) {
      const dx = pos[b].x - pos[a].x;
      const dy = pos[b].y - pos[a].y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = (d - 180) * 0.02 * alpha;
      const fx = (dx / d) * f;
      const fy = (dy / d) * f;
      vel[a].x += fx;
      vel[a].y += fy;
      vel[b].x -= fx;
      vel[b].y -= fy;
    }
    // gravity + integrate
    for (let i = 0; i < n; i++) {
      vel[i].x -= pos[i].x * 0.002 * alpha;
      vel[i].y -= pos[i].y * 0.002 * alpha;
      pos[i].x += vel[i].x;
      pos[i].y += vel[i].y;
      vel[i].x *= 0.6;
      vel[i].y *= 0.6;
    }
  }
  return { pos, degree };
}

export function GraphView({ nodes, edges }: { nodes: GNode[]; edges: GEdge[] }) {
  const router = useRouter();
  const [hideOrphans, setHideOrphans] = useState(false);

  const { flowNodes, flowEdges } = useMemo(() => {
    const { pos, degree } = layout(nodes, edges);
    const keep = new Set(
      nodes.filter((_, i) => !hideOrphans || degree[i] > 0).map((x) => x.id),
    );
    const flowNodes: Node[] = nodes
      .filter((x) => keep.has(x.id))
      .map((x) => {
        const i = nodes.indexOf(x);
        const size = 10 + Math.min(30, degree[i] * 5);
        return {
          id: x.id,
          position: { x: pos[i].x, y: pos[i].y },
          data: { label: x.title },
          style: {
            width: "auto",
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 11 + Math.min(6, degree[i]),
            fontWeight: degree[i] > 2 ? 700 : 500,
            background: colorSwatch(x.color),
            border: `${Math.max(1, size / 12)}px solid ${x.isJournal ? "#f59e0b" : "#a8a29e"}`,
            boxShadow: "0 1px 3px rgba(0,0,0,.08)",
            color: "#1c1917",
            cursor: "pointer",
          },
          sourcePosition: undefined,
          targetPosition: undefined,
        } as Node;
      });
    const flowEdges: Edge[] = edges
      .filter((e) => keep.has(e.sourceId) && keep.has(e.targetId))
      .map((e) => ({
        id: `${e.sourceId}-${e.targetId}`,
        source: e.sourceId,
        target: e.targetId,
        type: "straight",
        style: { stroke: "#c7c2b8", strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#c7c2b8", width: 14, height: 14 },
      }));
    return { flowNodes, flowEdges };
  }, [nodes, edges, hideOrphans]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-stone-200 bg-white/80 px-4 py-2 backdrop-blur">
        <h1 className="flex items-center gap-2 text-base font-semibold">
          <Share2 size={16} className="text-indigo-500" /> ナレッジグラフ
        </h1>
        <span className="text-xs text-stone-400">
          {nodes.length} カード · {edges.length} リンク
        </span>
        <label className="ml-auto flex items-center gap-1.5 text-xs text-stone-600">
          <input
            type="checkbox"
            checked={hideOrphans}
            onChange={(e) => setHideOrphans(e.target.checked)}
          />
          孤立したカードを隠す
        </label>
      </div>
      <div className="graph-view min-h-0 flex-1">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.05}
          nodesConnectable={false}
          nodesDraggable
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
          onNodeClick={(_e, n) => router.push(`/cards/${n.id}`)}
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1.4} color="#d6d3d1" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}

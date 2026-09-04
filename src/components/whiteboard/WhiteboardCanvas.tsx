"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type OnConnect,
} from "@xyflow/react";
import { ArrowLeft, BookOpen, Maximize2, Plus, X } from "lucide-react";
import { CardNode, type CardFlowNode, type CardNodeData } from "./CardNode";
import { CardPanel } from "./CardPanel";
import { CardLibrary } from "./CardLibrary";
import type { WhiteboardDetail } from "@/lib/whiteboards";
import { colorSwatch } from "@/lib/utils";

type SerializedBoard = Omit<WhiteboardDetail, "createdAt" | "updatedAt" | "nodes" | "edges"> & {
  nodes: (Omit<WhiteboardDetail["nodes"][number], "card"> & {
    card: Omit<WhiteboardDetail["nodes"][number]["card"], "updatedAt"> & { updatedAt: string };
  })[];
  edges: (Omit<WhiteboardDetail["edges"][number], "createdAt"> & { createdAt: string })[];
};

const nodeTypes: NodeTypes = { card: CardNode };

const defaultEdgeOptions = {
  type: "smoothstep" as const,
  markerEnd: { type: MarkerType.ArrowClosed, color: "#a8a29e", width: 18, height: 18 },
  labelStyle: { fontSize: 11, fill: "#57534e", fontWeight: 600 },
  labelBgStyle: { fill: "#fff", stroke: "#e7e5e4" },
  labelBgPadding: [6, 3] as [number, number],
  labelBgBorderRadius: 6,
};

export function WhiteboardCanvas({ board }: { board: SerializedBoard }) {
  return (
    <ReactFlowProvider>
      <Canvas board={board} />
    </ReactFlowProvider>
  );
}

function Canvas({ board }: { board: SerializedBoard }) {
  const api = useMemo(() => makeApi(board.id), [board.id]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();

  const [name, setName] = useState(board.name);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const onResizeEnd = useCallback(
    (nodeId: string, w: number, h: number, x: number, y: number) => {
      api.updateNodes([{ id: nodeId, width: w, height: h, x, y }]);
    },
    [api],
  );

  const initialNodes: CardFlowNode[] = useMemo(
    () =>
      board.nodes.map((n) => ({
        id: n.id,
        type: "card",
        position: { x: n.x, y: n.y },
        width: n.width,
        height: n.height,
        data: {
          cardId: n.card.id,
          title: n.card.title,
          content: n.card.content,
          color: n.card.color,
          isJournal: n.card.isJournal,
          onResizeEnd,
        },
      })),
    [board.nodes, onResizeEnd],
  );
  const initialEdges: Edge[] = useMemo(
    () =>
      board.edges.map((e) => ({
        id: e.id,
        source: e.sourceNodeId,
        target: e.targetNodeId,
        sourceHandle: e.sourceHandle ?? undefined,
        targetHandle: e.targetHandle ?? undefined,
        label: e.label || undefined,
      })),
    [board.edges],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<CardFlowNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);

  // Persist board name
  useEffect(() => {
    if (name === board.name) return;
    const t = setTimeout(() => api.updateBoard({ name }), 500);
    return () => clearTimeout(t);
  }, [name, board.name, api]);

  // ---- connections ----
  const onConnect: OnConnect = useCallback(
    async (conn: Connection) => {
      if (!conn.source || !conn.target || conn.source === conn.target) return;
      const created = await api.addEdge({
        sourceNodeId: conn.source,
        targetNodeId: conn.target,
        sourceHandle: conn.sourceHandle,
        targetHandle: conn.targetHandle,
      });
      setEdges((eds) =>
        addEdge(
          {
            id: created.id,
            source: conn.source,
            target: conn.target,
            sourceHandle: conn.sourceHandle ?? undefined,
            targetHandle: conn.targetHandle ?? undefined,
          },
          eds,
        ),
      );
    },
    [api, setEdges],
  );

  // ---- add nodes ----
  const centerPosition = useCallback(() => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const p = screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    return { x: p.x - 140 + (Math.random() - 0.5) * 60, y: p.y - 90 + (Math.random() - 0.5) * 60 };
  }, [screenToFlowPosition]);

  const appendNode = useCallback(
    (n: Awaited<ReturnType<typeof api.addNode>>) => {
      const node: CardFlowNode = {
        id: n.id,
        type: "card",
        position: { x: n.x, y: n.y },
        width: n.width,
        height: n.height,
        selected: true,
        data: {
          cardId: n.card.id,
          title: n.card.title,
          content: n.card.content,
          color: n.card.color,
          isJournal: n.card.isJournal,
          onResizeEnd,
        },
      };
      setNodes((ns) => [...ns.map((x) => ({ ...x, selected: false })), node]);
      setSelectedId(n.id);
    },
    [onResizeEnd, setNodes],
  );

  const createNewCard = useCallback(async () => {
    const pos = centerPosition();
    const n = await api.addNode({ title: "新しいカード", ...pos });
    appendNode(n);
  }, [api, appendNode, centerPosition]);

  const addExistingCard = useCallback(
    async (cardId: string, position?: { x: number; y: number }) => {
      const pos = position ?? centerPosition();
      const n = await api.addNode({ cardId, ...pos });
      appendNode(n);
    },
    [api, appendNode, centerPosition],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const cardId = e.dataTransfer.getData("application/pkm-card");
      if (!cardId) return;
      const p = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addExistingCard(cardId, { x: p.x - 140, y: p.y - 40 });
    },
    [addExistingCard, screenToFlowPosition],
  );

  // ---- card edits from panel ----
  const updateNodeData = useCallback(
    (nodeId: string, patch: Partial<CardNodeData>) => {
      setNodes((ns) => {
        const target = ns.find((n) => n.id === nodeId);
        if (!target) return ns;
        // Update every node that shows the same card
        return ns.map((n) =>
          n.data.cardId === target.data.cardId ? { ...n, data: { ...n.data, ...patch } } : n,
        );
      });
    },
    [setNodes],
  );

  const removeNodeFromBoard = useCallback(
    async (nodeId: string) => {
      setNodes((ns) => ns.filter((n) => n.id !== nodeId));
      setEdges((es) => es.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedId(null);
      await api.removeNode(nodeId);
    },
    [api, setEdges, setNodes],
  );

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;
  const cardIdsOnBoard = useMemo(() => new Set(nodes.map((n) => n.data.cardId)), [nodes]);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-stone-200 bg-white/80 px-3 py-2 backdrop-blur">
        <Link href="/whiteboards" className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100">
          <ArrowLeft size={16} />
        </Link>
        <span className="text-xl">{board.emoji}</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-base font-semibold tracking-tight outline-none"
        />
        <span className="text-xs text-stone-400">
          {nodes.length} カード · {edges.length} 接続
        </span>
        <button
          onClick={() => fitView({ padding: 0.2, duration: 400 })}
          className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100"
          title="全体表示"
        >
          <Maximize2 size={15} />
        </button>
        <button
          onClick={() => {
            setLibraryOpen((v) => !v);
            setSelectedId(null);
          }}
          className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium ${
            libraryOpen
              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
              : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
          }`}
        >
          <BookOpen size={14} /> カードを追加
        </button>
        <button
          onClick={createNewCard}
          className="flex items-center gap-1 rounded-lg bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700"
        >
          <Plus size={14} /> 新規カード
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        <div
          ref={wrapperRef}
          className="relative min-w-0 flex-1"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDrop={onDrop}
        >
          <ReactFlow<CardFlowNode, Edge>
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            connectionMode={ConnectionMode.Loose}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.1}
            maxZoom={2.5}
            deleteKeyCode={["Backspace", "Delete"]}
            proOptions={{ hideAttribution: true }}
            onNodeClick={(_e, n) => {
              setSelectedId(n.id);
              setLibraryOpen(false);
            }}
            onNodeDoubleClick={(_e, n) => {
              window.location.href = `/cards/${n.data.cardId}`;
            }}
            onPaneClick={() => setSelectedId(null)}
            onNodeDragStop={(_e, _n, dragged) => {
              api.updateNodes(
                dragged.map((d) => ({ id: d.id, x: d.position.x, y: d.position.y })),
              );
            }}
            onNodesDelete={(deleted: Node[]) => {
              deleted.forEach((d) => api.removeNode(d.id));
              if (deleted.some((d) => d.id === selectedId)) setSelectedId(null);
            }}
            onEdgesDelete={(deleted: Edge[]) => {
              deleted.forEach((d) => api.removeEdge(d.id));
            }}
            onEdgeDoubleClick={async (_e, edge) => {
              const label = prompt("接続のラベル", (edge.label as string) ?? "");
              if (label === null) return;
              await api.updateEdge(edge.id, { label });
              setEdges((es) =>
                es.map((x) => (x.id === edge.id ? { ...x, label: label || undefined } : x)),
              );
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={18} size={1.4} color="#d6d3d1" />
            <Controls showInteractive={false} position="bottom-left" />
            <MiniMap
              pannable
              zoomable
              position="bottom-right"
              nodeColor={(n) => colorSwatch((n.data as CardNodeData).color)}
              nodeStrokeColor="#a8a29e"
              maskColor="rgba(247,245,240,0.7)"
            />
          </ReactFlow>

          {nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 px-8 py-6 text-center text-sm text-stone-500">
                空のホワイトボードです。
                <br />
                「新規カード」または「カードを追加」から始めましょう。
              </div>
            </div>
          )}
        </div>

        {(selectedNode || libraryOpen) && (
          <aside className="flex w-[360px] shrink-0 flex-col border-l border-stone-200 bg-white">
            <div className="flex items-center justify-between border-b border-stone-100 px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                {selectedNode ? "カードを編集" : "カードライブラリ"}
              </span>
              <button
                onClick={() => {
                  setSelectedId(null);
                  setLibraryOpen(false);
                }}
                className="rounded-md p-1 text-stone-400 hover:bg-stone-100"
              >
                <X size={14} />
              </button>
            </div>
            {selectedNode ? (
              <CardPanel
                key={selectedNode.id}
                nodeId={selectedNode.id}
                data={selectedNode.data}
                onChange={(patch) => updateNodeData(selectedNode.id, patch)}
                onRemove={() => removeNodeFromBoard(selectedNode.id)}
              />
            ) : (
              <CardLibrary excludeIds={cardIdsOnBoard} onPick={(id) => addExistingCard(id)} />
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

// ---------- API helpers ----------
function makeApi(boardId: string) {
  const base = `/api/whiteboards/${boardId}`;
  const json = (method: string, url: string, body?: unknown) =>
    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    }).then((r) => r.json());

  return {
    updateBoard: (patch: { name?: string; emoji?: string; description?: string }) =>
      json("PATCH", base, patch),
    addNode: (input: {
      cardId?: string;
      title?: string;
      x: number;
      y: number;
    }): Promise<{
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      card: { id: string; title: string; content: string; color: string; isJournal: boolean };
    }> => json("POST", `${base}/nodes`, input),
    updateNodes: (updates: { id: string; x?: number; y?: number; width?: number; height?: number }[]) =>
      json("PATCH", `${base}/nodes`, { updates }),
    removeNode: (nodeId: string) => json("DELETE", `${base}/nodes/${nodeId}`),
    addEdge: (input: {
      sourceNodeId: string;
      targetNodeId: string;
      sourceHandle?: string | null;
      targetHandle?: string | null;
    }): Promise<{ id: string }> => json("POST", `${base}/edges`, input),
    updateEdge: (edgeId: string, patch: { label: string }) =>
      json("PATCH", `${base}/edges/${edgeId}`, patch),
    removeEdge: (edgeId: string) => json("DELETE", `${base}/edges/${edgeId}`),
  };
}

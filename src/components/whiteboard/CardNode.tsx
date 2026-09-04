"use client";

import { memo } from "react";
import { Handle, NodeResizer, Position, type Node, type NodeProps } from "@xyflow/react";
import { BookOpen } from "lucide-react";
import { Markdown } from "@/components/Markdown";
import { colorClasses } from "@/lib/utils";

export type CardNodeData = {
  cardId: string;
  title: string;
  content: string;
  color: string;
  isJournal: boolean;
  onResizeEnd?: (nodeId: string, w: number, h: number, x: number, y: number) => void;
};

export type CardFlowNode = Node<CardNodeData, "card">;

function CardNodeImpl({ id, data, selected }: NodeProps<CardFlowNode>) {
  return (
    <>
      <NodeResizer
        isVisible={!!selected}
        minWidth={160}
        minHeight={80}
        lineStyle={{ borderColor: "#6366f1" }}
        onResizeEnd={(_e, p) => data.onResizeEnd?.(id, p.width, p.height, p.x, p.y)}
      />
      <div
        className={`flex h-full w-full flex-col overflow-hidden rounded-xl border shadow-sm transition-shadow ${colorClasses(
          data.color,
        )} ${selected ? "shadow-lg ring-2 ring-indigo-400" : "hover:shadow-md"}`}
      >
        <div className="flex items-center gap-1.5 border-b border-black/5 px-3 py-2">
          {data.isJournal && <BookOpen size={12} className="shrink-0 text-amber-600" />}
          <div className="truncate text-[13px] font-semibold tracking-tight text-stone-900">
            {data.title}
          </div>
        </div>
        <div className="relative flex-1 overflow-hidden px-3 py-2">
          {data.content.trim() ? (
            <Markdown content={data.content} className="prose-sm pointer-events-none" />
          ) : (
            <span className="text-xs italic text-stone-400">ダブルクリックで開く</span>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white/70 to-transparent" />
        </div>
      </div>
      <Handle type="source" position={Position.Top} id="t" />
      <Handle type="source" position={Position.Right} id="r" />
      <Handle type="source" position={Position.Bottom} id="b" />
      <Handle type="source" position={Position.Left} id="l" />
    </>
  );
}

export const CardNode = memo(CardNodeImpl);

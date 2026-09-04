import { getGraph } from "@/lib/cards";
import { GraphView } from "@/components/GraphView";

export const dynamic = "force-dynamic";

export default async function GraphPage() {
  const graph = await getGraph();
  return <GraphView nodes={graph.nodes} edges={graph.edges} />;
}

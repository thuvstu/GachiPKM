import { listWhiteboards } from "@/lib/whiteboards";
import { WhiteboardList } from "@/components/WhiteboardList";

export const dynamic = "force-dynamic";

export default async function WhiteboardsPage() {
  const boards = await listWhiteboards();
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-8 py-8">
        <WhiteboardList boards={JSON.parse(JSON.stringify(boards))} />
      </div>
    </div>
  );
}

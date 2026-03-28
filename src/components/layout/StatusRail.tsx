import { Badge } from "../ui/Badge";

export function StatusRail({
  backendOnline,
  caseStatus,
  packetStatus
}: {
  backendOnline: boolean;
  caseStatus: string;
  packetStatus: string;
}) {
  return (
    <aside className="status-rail">
      <div className="status-stack">
        <Badge tone={backendOnline ? "success" : "warning"}>{backendOnline ? "API connected" : "API offline"}</Badge>
        <Badge>{caseStatus}</Badge>
        <Badge>{packetStatus}</Badge>
      </div>
      <p className="status-rail-copy">
        All state changes round-trip through the API.
      </p>
    </aside>
  );
}

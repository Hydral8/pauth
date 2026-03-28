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
        Backend state is authoritative. Every case mutation, submission transition, and voice action now round-trips through serverless API handlers.
      </p>
    </aside>
  );
}

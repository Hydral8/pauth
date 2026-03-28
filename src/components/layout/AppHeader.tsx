import { Badge } from "../ui/Badge";

export function AppHeader({ backendOnline }: { backendOnline: boolean }) {
  return (
    <nav className="topbar">
      <div className="brand-lockup">
        <div className="brand-mark" />
        <div>
          <p className="eyebrow">Prior Auth Operator</p>
          <h1>AuthFlow AI</h1>
        </div>
      </div>
      <div className="topbar-status">
        <Badge tone="live">TanStack frontend</Badge>
        <Badge tone={backendOnline ? "success" : "warning"}>{backendOnline ? "Working backend" : "Backend unavailable"}</Badge>
      </div>
    </nav>
  );
}

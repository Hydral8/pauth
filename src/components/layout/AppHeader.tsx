import { Badge } from "../ui/Badge";

export function AppHeader({ backendOnline }: { backendOnline: boolean }) {
  return (
    <nav className="topbar">
      <div className="brand-lockup">
        <div className="brand-mark" />
        <div>
          <p className="eyebrow">AI Prior Auth Operator</p>
          <h1>AuthFlow AI</h1>
        </div>
      </div>
      <div className="topbar-status">
        <Badge tone={backendOnline ? "success" : "warning"}>{backendOnline ? "Connected" : "Offline"}</Badge>
      </div>
    </nav>
  );
}

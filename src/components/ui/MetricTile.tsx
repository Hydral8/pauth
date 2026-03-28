import type { PropsWithChildren } from "react";

export function MetricTile({ label, children }: PropsWithChildren<{ label: string }>) {
  return (
    <div className="metric-tile">
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  );
}

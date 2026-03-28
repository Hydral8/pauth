import type { ReactNode } from "react";

export function SectionHeader({
  step,
  title,
  badge
}: {
  step: string;
  title: string;
  badge?: ReactNode;
}) {
  return (
    <div className="section-header">
      <div>
        <p className="section-kicker">{step}</p>
        <h3>{title}</h3>
      </div>
      {badge}
    </div>
  );
}

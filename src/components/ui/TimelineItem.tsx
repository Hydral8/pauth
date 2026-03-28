import type { AuditEvent } from "../../types/domain";

export function TimelineItem({ event }: { event: AuditEvent }) {
  return (
    <li className="timeline-item">
      <div className="timeline-dot" />
      <div className="timeline-copy">
        <strong>{event.title}</strong>
        <p>{event.detail}</p>
        <span className="timeline-actor">{event.actor.replaceAll("_", " ")}</span>
      </div>
      <span className="timeline-time">{new Date(event.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
    </li>
  );
}

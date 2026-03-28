import { Button } from "../ui/Button";

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="app-state-card">
      <p className="section-kicker">Connection issue</p>
      <h2>Could not load the demo case</h2>
      <p>The frontend shell is up, but the backend bootstrap request failed. Retry after starting the API.</p>
      <div className="hero-actions">
        <Button onClick={onRetry}>Retry</Button>
      </div>
    </div>
  );
}

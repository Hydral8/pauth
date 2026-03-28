import { Button } from "./Button";

export function CommandChip({ label, onClick, disabled = false }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <Button variant="secondary" className="command-chip" onClick={onClick} disabled={disabled}>
      {label}
    </Button>
  );
}

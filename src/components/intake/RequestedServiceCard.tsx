import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import type { RequestedService } from "../../types/domain";

export function RequestedServiceCard({ requestedService }: { requestedService: RequestedService }) {
  return (
    <Card className="intake-service-card spotlight">
      <div className="panel-title-row">
        <div>
          <span>Requested service</span>
          <strong>{requestedService.label}</strong>
        </div>
        {requestedService.cptCode ? <Badge>{requestedService.cptCode}</Badge> : null}
      </div>

      <p>{requestedService.rationale}</p>

      <div className="intake-chip-row">
        {requestedService.icd10Codes.map((code) => (
          <span key={code} className="fact-tag intake-chip-inverse">
            {code}
          </span>
        ))}
      </div>
    </Card>
  );
}

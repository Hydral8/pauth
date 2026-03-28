import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import type { PatientInfo } from "../../types/domain";

export function PatientSnapshotCard({ patient }: { patient: PatientInfo }) {
  return (
    <Card className="intake-snapshot-card">
      <div className="panel-title-row">
        <div>
          <span>Patient snapshot</span>
          <strong>
            {patient.name}, {patient.age}
          </strong>
        </div>
        <Badge>{patient.payer}</Badge>
      </div>

      <div className="snapshot-meta-grid">
        <div className="signal-card">
          <span>Member ID</span>
          <strong>{patient.memberId}</strong>
        </div>
        <div className="signal-card">
          <span>Active meds</span>
          <strong>{patient.medications.length}</strong>
        </div>
      </div>

      <div className="intake-chip-row">
        {patient.diagnosis.map((code) => (
          <span key={code} className="fact-tag">
            {code}
          </span>
        ))}
      </div>

      <ul className="data-list">
        {patient.history.map((item) => (
          <li key={item}>
            <div>
              <strong>{item}</strong>
              <p>Included in the structured intake summary for downstream review.</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

import { Badge } from "../ui/Badge";
import { Panel } from "../ui/Panel";
import { SectionHeader } from "../ui/SectionHeader";
import type { AppActionHandler } from "../../types/actions";
import type { CaseRecord } from "../../types/domain";
import { DocumentUploadGrid } from "./DocumentUploadGrid";
import { EditableIntakeFields } from "./EditableIntakeFields";
import { PatientSnapshotCard } from "./PatientSnapshotCard";
import { RequestedServiceCard } from "./RequestedServiceCard";

export function IntakePanel({ caseRecord, dispatch }: { caseRecord: CaseRecord; dispatch: AppActionHandler }) {
  return (
    <Panel>
      <SectionHeader step="Step 1" title="Case Intake" badge={<Badge>FHIR-like structure</Badge>} />

      <div className="intake-panel-layout">
        <DocumentUploadGrid documents={caseRecord.documents} dispatch={dispatch} />

        <div className="intake-summary-grid">
          <PatientSnapshotCard patient={caseRecord.patient} />
          <RequestedServiceCard requestedService={caseRecord.requestedService} />
        </div>

        <EditableIntakeFields caseRecord={caseRecord} dispatch={dispatch} />
      </div>
    </Panel>
  );
}

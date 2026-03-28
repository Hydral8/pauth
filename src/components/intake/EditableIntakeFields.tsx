import { useEffect, useState, type FormEvent } from "react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import type { AppActionHandler } from "../../types/actions";
import type { CaseRecord } from "../../types/domain";

interface EditableIntakeFieldsProps {
  caseRecord: CaseRecord;
  dispatch: AppActionHandler;
}

interface IntakeDraft {
  memberId: string;
  diagnosisCodes: string;
  rationale: string;
  reviewerNote: string;
}

function createDraft(caseRecord: CaseRecord): IntakeDraft {
  return {
    memberId: caseRecord.patient.memberId,
    diagnosisCodes: caseRecord.requestedService.icd10Codes.join(", "),
    rationale: caseRecord.requestedService.rationale,
    reviewerNote: caseRecord.recommendation.missingItems[0] ?? ""
  };
}

export function EditableIntakeFields({ caseRecord, dispatch }: EditableIntakeFieldsProps) {
  const [draft, setDraft] = useState(() => createDraft(caseRecord));
  const [statusMessage, setStatusMessage] = useState("Draft fields are editable for reviewer prep.");

  useEffect(() => {
    setDraft(createDraft(caseRecord));
    setStatusMessage("Draft fields are editable for reviewer prep.");
  }, [caseRecord]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.reviewerNote.trim()) {
      setStatusMessage("Add a reviewer note before syncing the intake workspace.");
      return;
    }

    dispatch({
      type: "RESOLVE_MISSING_ITEM",
      payload: {
        note: `Reviewer intake update: ${draft.reviewerNote.trim()}`,
        source: "manual"
      }
    });
    setStatusMessage("Reviewer note synced into the shared case timeline.");
  }

  return (
    <Card className="intake-fields-card">
      <div className="panel-title-row">
        <div>
          <span>Editable intake fields</span>
          <strong>Reviewer workspace</strong>
        </div>
        <p>Use this surface to prepare a clean handoff before approval.</p>
      </div>

      <form className="intake-form" onSubmit={handleSubmit}>
        <label className="intake-field">
          <span>Member ID</span>
          <input
            value={draft.memberId}
            onChange={(event) => setDraft((current) => ({ ...current, memberId: event.target.value }))}
          />
        </label>

        <label className="intake-field">
          <span>Diagnosis codes</span>
          <input
            value={draft.diagnosisCodes}
            onChange={(event) => setDraft((current) => ({ ...current, diagnosisCodes: event.target.value }))}
          />
        </label>

        <label className="intake-field intake-field-wide">
          <span>Service rationale</span>
          <textarea
            rows={4}
            value={draft.rationale}
            onChange={(event) => setDraft((current) => ({ ...current, rationale: event.target.value }))}
          />
        </label>

        <label className="intake-field intake-field-wide">
          <span>Reviewer note</span>
          <textarea
            rows={4}
            value={draft.reviewerNote}
            onChange={(event) => setDraft((current) => ({ ...current, reviewerNote: event.target.value }))}
          />
        </label>

        <div className="intake-form-footer">
          <p>{statusMessage}</p>
          <Button type="submit" variant="secondary">
            Sync note to case
          </Button>
        </div>
      </form>
    </Card>
  );
}

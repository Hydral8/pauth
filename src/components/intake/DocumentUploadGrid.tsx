import { Badge } from "../ui/Badge";
import type { AppActionHandler } from "../../types/actions";
import type { SourceDocument } from "../../types/domain";

interface DocumentUploadGridProps {
  documents: SourceDocument[];
  dispatch: AppActionHandler;
}

function formatDocumentKind(kind: SourceDocument["kind"]) {
  return kind.replace("_", " ");
}

function formatUploadTime(uploadedAt: string) {
  return new Date(uploadedAt).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function DocumentUploadGrid({ documents, dispatch }: DocumentUploadGridProps) {
  return (
    <div className="intake-upload-grid">
      {documents.map((document) => (
        <label key={document.id} className="upload-card intake-upload-card">
          <div className="intake-upload-header">
            <span>{document.title}</span>
            <Badge tone="live">{formatDocumentKind(document.kind)}</Badge>
          </div>
          <strong>{document.fileName}</strong>
          <p>Drop in the latest source file to refresh extraction for this slot.</p>
          <div className="intake-upload-meta">
            <span>Last indexed</span>
            <strong>{formatUploadTime(document.uploadedAt)}</strong>
          </div>
          <input
            type="file"
            onChange={(event) => {
              const fileName = event.target.files?.[0]?.name;
              if (fileName) {
                dispatch({ type: "UPLOAD_DOCUMENT", payload: { kind: document.kind, fileName } });
              }
            }}
          />
        </label>
      ))}
    </div>
  );
}

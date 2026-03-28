import { useState } from "react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Panel } from "../ui/Panel";
import { SectionHeader } from "../ui/SectionHeader";
import { exportAuditLog } from "../../app/api";
import type { VoiceStatusResponse } from "../../types/api";

interface AgentConfig {
  id: string;
  name: string;
  actor: string;
  description: string;
  owns: string[];
  permission: string | null;
  permissionLabel?: string;
}

const AGENTS: AgentConfig[] = [
  {
    id: "extraction",
    name: "Extraction Agent",
    actor: "extraction_agent",
    description: "Parses uploaded documents to extract clinical facts, diagnosis codes, and patient history using OpenAI.",
    owns: ["backend/agents/extractionAgent.ts", "api/case/intake.ts"],
    permission: null,
  },
  {
    id: "policy",
    name: "Policy Agent",
    actor: "policy_agent",
    description: "Evaluates extracted facts against payer policy criteria. Computes confidence and identifies gaps.",
    owns: ["backend/agents/policyAgent.ts"],
    permission: null,
  },
  {
    id: "drafting",
    name: "Drafting Agent",
    actor: "drafting_agent",
    description: "Generates the prior authorization request letter and assembles the submission packet.",
    owns: ["backend/agents/draftingAgent.ts"],
    permission: "draft",
    permissionLabel: "Requires explicit trigger",
  },
  {
    id: "submission",
    name: "Submission Agent",
    actor: "submission_agent",
    description: "Submits the authorization packet to the payer endpoint. Cannot run without human approval.",
    owns: ["backend/submissionService.ts", "api/submit.ts"],
    permission: "submit",
    permissionLabel: "Requires human approval",
  },
  {
    id: "voice",
    name: "Voice Router",
    actor: "voice_router",
    description: "Classifies voice commands using OpenAI and routes them to the appropriate action.",
    owns: ["backend/agents/intentClassifier.ts", "backend/voiceService.ts"],
    permission: null,
  },
];

export function SettingsPanel({
  backendOnline,
  voiceStatus,
}: {
  backendOnline: boolean;
  voiceStatus?: VoiceStatusResponse;
}) {
  const [grantedPermissions, setGrantedPermissions] = useState<Set<string>>(new Set());
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  function togglePermission(perm: string) {
    setGrantedPermissions((prev) => {
      const next = new Set(prev);
      next.has(perm) ? next.delete(perm) : next.add(perm);
      return next;
    });
  }

  async function handleExport() {
    setExportStatus("Exporting...");
    try {
      const data = await exportAuditLog("case-demo-001");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-${data.caseId}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus(`Exported ${data.totalEvents} events`);
    } catch (error) {
      setExportStatus(error instanceof Error ? error.message : "Export failed");
    }
  }

  return (
    <Panel>
      <SectionHeader
        step="AgentOS"
        title="Agent Permissions"
        badge={<Badge tone={backendOnline ? "success" : "warning"}>{backendOnline ? "System online" : "Backend offline"}</Badge>}
      />

      <div className="settings-grid">
        {AGENTS.map((agent) => (
          <Card key={agent.id}>
            <div className="panel-title-row">
              <div>
                <strong>{agent.name}</strong>
              </div>
              <Badge tone={agent.permission ? (grantedPermissions.has(agent.permission) ? "success" : "warning") : "live"}>
                {agent.permission
                  ? grantedPermissions.has(agent.permission) ? "Granted" : "Gated"
                  : "Auto"}
              </Badge>
            </div>
            <p>{agent.description}</p>
            <div className="settings-rows">
              <div className="setting-row">
                <div className="setting-row-info">
                  <strong>Owns</strong>
                  <code>{agent.owns.join(", ")}</code>
                </div>
              </div>
              {agent.permission && (
                <div className="setting-row">
                  <div className="setting-row-info">
                    <strong>Permission gate</strong>
                    <p>{agent.permissionLabel}</p>
                  </div>
                  <Button
                    variant={grantedPermissions.has(agent.permission) ? "primary" : "secondary"}
                    onClick={() => togglePermission(agent.permission!)}
                  >
                    {grantedPermissions.has(agent.permission) ? "Revoke" : "Grant"}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}

        <Card>
          <div className="panel-title-row">
            <div>
              <strong>Orchestration Pipeline</strong>
            </div>
            <Badge>Sequential</Badge>
          </div>
          <p>Agents execute in order. Permission-gated agents pause the pipeline until access is granted.</p>
          <div className="settings-steps">
            {AGENTS.filter((a) => a.id !== "voice").map((agent, i) => (
              <div key={agent.id} className="settings-step">
                <span className="settings-step-num">{i + 1}</span>
                <div>
                  <strong>{agent.name}</strong>
                  <p>
                    {agent.permission
                      ? `Gated — requires "${agent.permission}" permission`
                      : "Runs automatically"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="panel-title-row">
            <div>
              <strong>Audit & Compliance</strong>
            </div>
            <Badge>{backendOnline ? "Ready" : "Offline"}</Badge>
          </div>
          <p>Every agent action is logged with actor, timestamp, and detail. Export the full audit trail for compliance review.</p>
          <div className="settings-rows">
            <div className="setting-row">
              <div className="setting-row-info">
                <strong>Export audit log</strong>
                <p>{exportStatus ?? "Download the full event timeline as JSON"}</p>
              </div>
              <Button variant="secondary" onClick={handleExport}>
                Export
              </Button>
            </div>
            <div className="setting-row">
              <div className="setting-row-info">
                <strong>Voice provider</strong>
                <code>{voiceStatus?.configured ? "Vapi (connected)" : "Vapi (not configured)"}</code>
              </div>
              <Badge tone={voiceStatus?.configured ? "success" : "warning"}>
                {voiceStatus?.configured ? "Connected" : "Not set"}
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </Panel>
  );
}

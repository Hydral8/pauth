Product Requirements Document (PRD)
Product Name

AuthFlow AI

One-line

AI prior authorization operator that converts clinical intake + policy into a submission-ready auth with audit, voice control, and human approval.

1. Objective

Reduce prior auth time from ~20–30 minutes to <3 minutes while maintaining compliance, traceability, and human oversight.

2. Target User
Physician / clinic staff
Medical assistant
Prior auth specialist
3. Core Demo Narrative

Input → reasoning → recommendation → approval → submission

Patient interview + clinical note comes in
System builds structured case
Checks payer policy
Produces recommendation + missing items
User approves via click or voice
Agent submits prior auth
4. Key Features
4.1 Case Ingestion

Inputs:

Clinical note (text or PDF)
Patient info (age, history, meds)
Requested procedure / drug
Payer policy doc

Output:

Structured case (FHIR-like schema)
4.2 Clinical + Policy Reasoning Engine
Extracts relevant facts
Maps to CPT / ICD
Parses payer policy
Matches criteria line-by-line

Output:

Approval likelihood (approve / deny / incomplete)
Evidence matched to policy clauses
Missing requirements
4.3 Auto Draft Prior Auth Packet

Generates:

Completed auth form
Supporting summary
Attached evidence references
4.4 Human-in-the-loop Approval
Editable fields
Inline corrections
“Approve & Submit” action
4.5 Voice Interface (Differentiator)

Hands-free control layer

Capabilities:

“Summarize patient”
“Why is this denied?”
“What’s missing?”
“Add note: failed conservative therapy for 6 weeks”
“Approve and send”

Voice → structured command → system action

4.6 Agent Execution Layer (light AgentOS)

Agents run in parallel:

Extraction agent
Policy matching agent
Drafting agent
Submission agent

With:

permission gating (cannot submit without approval)
full audit logs
replay capability
4.7 Audit + Compliance Layer
Every decision linked to:
source document
policy clause
Timeline of actions
Exportable log
5. Demo Flow (Critical)
Step 1: Intake

Upload:

clinical note
payer policy PDF

System:

instantly structures case
Step 2: Live reasoning

Show:

extracted facts
policy criteria checklist
matched vs missing
Step 3: Recommendation

Display:

“Likely approved”
confidence %
missing item (if any)
Step 4: Voice interaction

User says:

“Explain decision”
“Add missing documentation: prior PT failed”

System updates in real time

Step 5: Final approval

User:

clicks OR says “submit”
Step 6: Agent execution

System:

generates auth packet
shows submission status
logs full trace
6. System Architecture (Hackathon-level)
Frontend
React / Next.js
Components:
document viewer
policy checklist
audit timeline
voice interface
Backend
FastAPI

Modules:

ingestion pipeline
LLM orchestration
policy parser
agent executor
LLM Layer
extraction prompt
policy matching prompt
drafting prompt
tool calling for actions
Voice Layer
speech-to-text (Whisper / API)
intent parser (LLM)
command router
Data Model (simplified)
Case:
  patient_info
  clinical_facts
  requested_service
  payer_policy
  decision
  missing_items
  audit_log
7. Success Criteria (for hackathon)
End-to-end flow works live
Clear time reduction shown
Policy matching visibly correct
Voice commands work reliably
Audit trail is legible
8. Stretch Features
multi-payer support
real CPT/ICD validation
EHR integration mock
confidence calibration
9. What makes this win
obvious pain (everyone understands insurance friction)
concrete output (submission-ready auth)
trust layer (audit + citations)
interaction novelty (voice)
infra credibility (agent permissions + logs)
10. Team Split

1. ML / LLM

extraction + policy matching
reasoning + drafting

2. Backend

agent orchestration
audit logging
submission pipeline

3. Frontend

case UI
policy checklist
audit timeline
voice UX
Final Positioning

Not:
“AI for healthcare workflows”

But:
“We built an AI prior auth operator that reasons over policy, explains every decision, and submits with full auditability, controlled by voice or click.”

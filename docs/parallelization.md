# AuthFlow AI Parallelization Plan

## Frontend agents

### Agent F1: App shell and integration
- Owns `src/app/*`
- Owns `src/components/layout/*`
- Owns `src/components/ui/*`
- Owns final integration, global composition, and merge conflict resolution
- Only this agent should change shared frontend contracts after initial publish

### Agent F2: Intake and case workspace
- Owns `src/components/intake/*`
- Builds document upload cards, patient snapshot, requested service, and editable intake fields
- Must consume `CaseRecord` and `AppAction` directly without introducing new case shapes

### Agent F3: Reasoning and recommendation UI
- Owns `src/components/reasoning/*`
- Builds facts, policy checklist, confidence display, decision cards, and evidence mapping
- Uses selectors for derived state instead of recomputing logic inside components

### Agent F4: Voice command UX
- Owns `src/components/voice/*`
- Co-owns `src/lib/voice.ts` only if integration owner approves contract changes
- Builds voice controls, transcript rendering, fallback behavior, and command chips
- Must emit commands through the shared intent contract

### Agent F5: Approval, audit, and execution UI
- Owns `src/components/audit/*`
- Builds approval controls, audit timeline, replay affordances, and submission status views
- Must not change submission state semantics without coordinating with backend agents

## Backend agents

### Agent B1: Intake and case API
- Owns `api/case/*`
- Owns `backend/caseService.ts`
- Owns `backend/caseStore.ts`
- Responsible for demo case retrieval, intake upload metadata flow, and canonical case payload shape
- Maintains alignment with `CaseRecord`

### Agent B2: Reasoning and voice API
- Owns `api/voice/*`
- Owns `backend/voiceService.ts`
- Responsible for voice intent parsing, reasoning explanations, and command response payloads
- Responsible for Vapi integration and webhook handling
- Must return data in the shared API response types

### Agent B3: Submission and audit API
- Owns `api/submit.ts`
- Owns `backend/submissionService.ts`
- Responsible for approval gating, submit endpoint behavior, confirmation ids, and audit export wiring
- Owns backend-side execution status semantics

## Shared contracts

- Frontend source of truth:
  - `src/types/domain.ts`
  - `src/types/actions.ts`
  - `src/types/api.ts`
- Backend source of truth:
  - `src/types/api.ts`
- If backend needs a new payload field, update the shared type first, then route/service code
- Do not duplicate request or response interfaces inside route files

## Coordination rules

- Agent F1 and Agent B1 act as contract stewards for frontend and backend respectively
- Shared contracts can only change through steward review
- Each agent edits only its owned folder plus tests for that folder
- Global CSS tokens live only in `src/styles/tokens.css`
- Mock/demo content lives in service or mock data files, never inside UI primitives
- Serverless handlers stay thin; business logic belongs in `backend/*`
- Services must return typed objects, not raw Express responses
- No agent should add a second state model or alternate API shape

## Merge order

1. F1 and B1 publish contracts and skeletons
2. F2-F5 and B2-B3 build in parallel
3. B1 integrates backend routes
4. F1 integrates frontend sections against stable endpoints
5. F1 and B3 perform end-to-end submit flow validation

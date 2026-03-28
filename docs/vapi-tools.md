# Vapi Tool Setup

Register a narrow tool surface for the assistant. Do not expose generic reducer actions.

## Tool endpoints

- `POST /api/tools/get-case-summary`
- `POST /api/tools/get-missing-criteria`
- `POST /api/tools/add-case-note`
- `POST /api/tools/approve-case`
- `POST /api/tools/submit-case`
- `POST /api/tools/get-audit-events`

All tools accept JSON and should include `caseId` when you are working with a case other than the default demo case.

## Recommended Vapi tools

### `get_case_summary`

Description: Fetch a concise status summary for the current authorization case.

Parameters:

```json
{
  "type": "object",
  "properties": {
    "caseId": {
      "type": "string",
      "description": "Optional case id. Defaults to the demo case if omitted."
    }
  }
}
```

Server mapping:

- Endpoint: `POST /api/tools/get-case-summary`

### `get_missing_criteria`

Description: Return the missing policy requirements that are blocking approval or submission.

Parameters:

```json
{
  "type": "object",
  "properties": {
    "caseId": {
      "type": "string"
    }
  }
}
```

Server mapping:

- Endpoint: `POST /api/tools/get-missing-criteria`

### `add_case_note`

Description: Record a documentation note against the case.

Parameters:

```json
{
  "type": "object",
  "properties": {
    "caseId": {
      "type": "string"
    },
    "note": {
      "type": "string",
      "description": "The exact documentation note to store on the case."
    }
  },
  "required": ["note"]
}
```

Server mapping:

- Endpoint: `POST /api/tools/add-case-note`

### `approve_case`

Description: Mark the case approved if all required criteria are satisfied.

Parameters:

```json
{
  "type": "object",
  "properties": {
    "caseId": {
      "type": "string"
    }
  }
}
```

Server mapping:

- Endpoint: `POST /api/tools/approve-case`

Behavior:

- Returns `409` if approval is blocked by missing criteria.

### `submit_case`

Description: Submit the authorization packet if the case is explicitly approved and no blocking criteria remain.

Parameters:

```json
{
  "type": "object",
  "properties": {
    "caseId": {
      "type": "string"
    }
  }
}
```

Server mapping:

- Endpoint: `POST /api/tools/submit-case`

Behavior:

- Returns `409` if the case is not approved.
- Returns `409` if the case still has missing criteria.

### `get_audit_events`

Description: Fetch recent audit log entries for explanation or replay.

Parameters:

```json
{
  "type": "object",
  "properties": {
    "caseId": {
      "type": "string"
    },
    "limit": {
      "type": "number",
      "description": "Maximum number of recent audit events to return."
    }
  }
}
```

Server mapping:

- Endpoint: `POST /api/tools/get-audit-events`

## Assistant prompt guidance

Tell the assistant:

- Use tools to answer case-specific questions instead of guessing.
- Call `get_missing_criteria` before saying why a case is blocked.
- Call `add_case_note` when the user dictates a documentation update.
- Call `approve_case` before `submit_case`.
- Never say a case is submitted unless `submit_case` returns success.

## Suggested execution order

- Summary request: `get_case_summary`
- Missing/blocked request: `get_missing_criteria`
- Documentation update: `add_case_note`
- Approval request: `approve_case`
- Final send request: `submit_case`

## Important note

These tools are workflow-safe only at the app level. They are not yet protected by user auth or webhook signature verification, so do not treat them as production-secure yet.

/**
 * Registers tool definitions with your Vapi assistant.
 *
 * Usage:
 *   VAPI_PRIVATE_KEY=... VAPI_ASSISTANT_ID=... PUBLIC_SERVER_URL=... npx tsx scripts/setup-vapi-tools.ts
 *
 * Or with .env loaded:
 *   node --import tsx scripts/setup-vapi-tools.ts
 */

import "dotenv/config";

const VAPI_KEY = process.env.VAPI_PRIVATE_KEY;
const ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;
const SERVER_URL = process.env.PUBLIC_SERVER_URL;

if (!VAPI_KEY || !ASSISTANT_ID || !SERVER_URL) {
  console.error("Missing env vars: VAPI_PRIVATE_KEY, VAPI_ASSISTANT_ID, PUBLIC_SERVER_URL");
  process.exit(1);
}

const TOOLS_ENDPOINT = `${SERVER_URL}/api/tools`;

const tools = [
  {
    type: "function",
    function: {
      name: "get-case-summary",
      description:
        "Get a summary of the current prior authorization case including patient name, requested service, payer, status, recommendation, and confidence score.",
      parameters: {
        type: "object",
        properties: {
          caseId: {
            type: "string",
            description: "The case ID. Defaults to the active demo case if omitted.",
          },
        },
        required: [],
      },
    },
    server: { url: TOOLS_ENDPOINT },
  },
  {
    type: "function",
    function: {
      name: "get-missing-criteria",
      description:
        "Check which policy criteria are still missing or unmet for the current case. Returns the missing items and the next step needed.",
      parameters: {
        type: "object",
        properties: {
          caseId: {
            type: "string",
            description: "The case ID.",
          },
        },
        required: [],
      },
    },
    server: { url: TOOLS_ENDPOINT },
  },
  {
    type: "function",
    function: {
      name: "add-case-note",
      description:
        "Add a clinical note or documentation to the case. Use this when the caller mentions treatment history, test results, or any clinical information that should be recorded. This can resolve missing policy criteria.",
      parameters: {
        type: "object",
        properties: {
          caseId: {
            type: "string",
            description: "The case ID.",
          },
          note: {
            type: "string",
            description:
              "The clinical note to add. For example: 'Patient completed 6 weeks of supervised physical therapy without improvement.'",
          },
        },
        required: ["note"],
      },
    },
    server: { url: TOOLS_ENDPOINT },
  },
  {
    type: "function",
    function: {
      name: "approve-case",
      description:
        "Approve the prior authorization case for submission. Only works when all policy criteria are satisfied. The caller must explicitly confirm they want to approve.",
      parameters: {
        type: "object",
        properties: {
          caseId: {
            type: "string",
            description: "The case ID.",
          },
          source: {
            type: "string",
            enum: ["voice", "manual"],
            description: "How the approval was given. Use 'voice' for phone approvals.",
          },
        },
        required: [],
      },
    },
    server: { url: TOOLS_ENDPOINT },
  },
  {
    type: "function",
    function: {
      name: "submit-case",
      description:
        "Submit the approved prior authorization to the payer. Only works after the case has been approved. Returns confirmation ID on success.",
      parameters: {
        type: "object",
        properties: {
          caseId: {
            type: "string",
            description: "The case ID.",
          },
        },
        required: [],
      },
    },
    server: { url: TOOLS_ENDPOINT },
  },
  {
    type: "function",
    function: {
      name: "get-audit-events",
      description:
        "Get the recent audit trail for the case. Shows what actions were taken, by whom, and when.",
      parameters: {
        type: "object",
        properties: {
          caseId: {
            type: "string",
            description: "The case ID.",
          },
          limit: {
            type: "number",
            description: "Number of recent events to return. Defaults to 5.",
          },
        },
        required: [],
      },
    },
    server: { url: TOOLS_ENDPOINT },
  },
];

async function setupAssistant() {
  console.log(`Updating assistant ${ASSISTANT_ID} with ${tools.length} tools...`);
  console.log(`Tools endpoint: ${TOOLS_ENDPOINT}`);

  const response = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${VAPI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: {
        provider: "openai",
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a prior authorization assistant for AuthFlow AI. You help healthcare staff manage prior authorization cases by phone.

You can:
- Summarize the current case (patient, service, status)
- Check which policy criteria are missing
- Add clinical notes and documentation from the caller
- Approve cases when all criteria are met (only if the caller explicitly asks)
- Submit approved cases to the payer
- Review the audit trail

Be concise and professional. When the caller provides clinical information (e.g., "the patient did 6 weeks of PT"), use the add-case-note tool to record it. Always confirm before approving or submitting.

Start by greeting the caller and asking how you can help with their prior authorization.`,
          },
        ],
        tools,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Failed to update assistant: ${response.status}`, error);
    process.exit(1);
  }

  const result = await response.json();
  console.log("Assistant updated successfully!");
  console.log(`Tools registered: ${tools.map((t) => t.function.name).join(", ")}`);
  console.log(`Assistant ID: ${(result as any).id}`);
}

setupAssistant();

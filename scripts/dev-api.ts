import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import demoHandler from "../api/case/demo";
import intakeHandler from "../api/case/intake";
import actionHandler from "../api/case/action";
import orchestrateHandler from "../api/case/orchestrate";
import healthHandler from "../api/health";
import submitHandler from "../api/submit";
import voiceHandler from "../api/voice/index";
import voiceWebhookHandler from "../api/voice/webhook";
import toolsHandler from "../api/tools/index";

type Handler = (
  request: { body: any; query?: Record<string, string | undefined>; method?: string; url?: string },
  response: { status: (code: number) => { json: (body: unknown) => void } }
) => void | Promise<void>;

const routes: Record<string, Handler> = {
  "GET /api/health": healthHandler,
  "GET /api/case/demo": demoHandler,
  "POST /api/case/demo": demoHandler,
  "POST /api/case/intake": intakeHandler,
  "POST /api/case/action": actionHandler,
  "POST /api/case/orchestrate": orchestrateHandler,
  "POST /api/submit": submitHandler,
  "GET /api/voice": voiceHandler,
  "POST /api/voice": voiceHandler,
  "POST /api/voice/webhook": voiceWebhookHandler,
  "POST /api/tools": toolsHandler
};

function readBody(request: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function createResponse(response: ServerResponse) {
  return {
    status(code: number) {
      response.statusCode = code;
      return {
        json(body: unknown) {
          response.setHeader("Content-Type", "application/json");
          response.end(JSON.stringify(body));
        }
      };
    }
  };
}

createServer(async (request, response) => {
  const method = request.method ?? "GET";
  const url = new URL(request.url ?? "/", "http://localhost:3001");
  const key = `${method} ${url.pathname}`;
  const handler = routes[key];

  if (!handler) {
    response.statusCode = 404;
    response.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  const rawBody = method === "GET" ? "" : await readBody(request);
  const body = rawBody ? JSON.parse(rawBody) : {};
  const query = Object.fromEntries(url.searchParams.entries());

  try {
    await handler(
      {
        body,
        query,
        method,
        url: request.url
      },
      createResponse(response)
    );
  } catch (error) {
    response.statusCode = 500;
    response.setHeader("Content-Type", "application/json");
    response.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown server error"
      })
    );
  }
}).listen(3001, "127.0.0.1", () => {
  console.log("Local serverless API listening on http://127.0.0.1:3001");
});

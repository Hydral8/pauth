import OpenAI from "openai";

let client: OpenAI | null = null;

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export async function chatJSON<T>(
  system: string,
  user: string,
  model?: string
): Promise<T> {
  const openai = getClient();
  const response = await openai.chat.completions.create({
    model: model ?? process.env.OPENAI_MODEL ?? "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.3,
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("Empty OpenAI response");
  return JSON.parse(text) as T;
}

export async function chatText(
  system: string,
  user: string,
  model?: string
): Promise<string> {
  const openai = getClient();
  const response = await openai.chat.completions.create({
    model: model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.3,
    max_tokens: 500,
  });

  return response.choices[0]?.message?.content ?? "";
}

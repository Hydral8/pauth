export function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

export async function readJson<T>(request: Request): Promise<T> {
  return request.json() as Promise<T>;
}

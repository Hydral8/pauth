import { createClient } from "@libsql/client";

let schemaReady = false;

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getClient() {
  return createClient({
    url: requireEnv("TURSO_DATABASE_URL"),
    authToken: requireEnv("TURSO_AUTH_TOKEN")
  });
}

export async function getDb() {
  const db = getClient();

  if (!schemaReady) {
    await db.batch(
      [
        `
          CREATE TABLE IF NOT EXISTS authflow_cases (
            id TEXT PRIMARY KEY,
            payload TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        `,
        `
          CREATE TABLE IF NOT EXISTS authflow_meta (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        `
      ],
      "write"
    );
    schemaReady = true;
  }

  return db;
}

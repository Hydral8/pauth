import { createClient } from "@libsql/client";

let schemaReady = false;

function getEnv(name: string) {
  return process.env[name];
}

export function isTursoConfigured() {
  return Boolean(getEnv("TURSO_DATABASE_URL") && getEnv("TURSO_AUTH_TOKEN"));
}

export function getPersistenceMode() {
  return isTursoConfigured() ? "remote" : "memory";
}

function getClient() {
  const url = getEnv("TURSO_DATABASE_URL");
  const authToken = getEnv("TURSO_AUTH_TOKEN");

  if (!url || !authToken) {
    throw new Error("Turso is not configured.");
  }

  return createClient({
    url,
    authToken
  });
}

export async function getDb() {
  const db = getClient();

  if (!schemaReady) {
    await db.batch(
      [
        {
          sql: `
            CREATE TABLE IF NOT EXISTS authflow_cases (
              id TEXT PRIMARY KEY,
              payload TEXT NOT NULL,
              updated_at TEXT NOT NULL
            )
          `
        },
        {
          sql: `
            CREATE TABLE IF NOT EXISTS authflow_meta (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL,
              updated_at TEXT NOT NULL
            )
          `
        }
      ],
      "write"
    );
    schemaReady = true;
  }

  return db;
}

/**
 * Run a single SQL migration file against Supabase Postgres.
 * Requires DATABASE_URL in .env.local (Supabase → Settings → Database → URI).
 *
 * Usage: node scripts/run-sql-migration.mjs supabase/migrations/019_screener_versioning.sql
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const migrationArg = process.argv[2];
if (!migrationArg) {
  console.error("Usage: node scripts/run-sql-migration.mjs <path-to.sql>");
  process.exit(1);
}

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(root, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    /* optional */
  }
}

loadEnvLocal();

const databaseUrl = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL;
if (!databaseUrl) {
  console.error(
    "Set DATABASE_URL (or SUPABASE_DB_URL) in .env.local to your Supabase Postgres connection string.",
  );
  process.exit(1);
}

const sqlPath = resolve(root, migrationArg);
const sql = readFileSync(sqlPath, "utf8");

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log(`Applied migration: ${migrationArg}`);
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
} finally {
  await client.end();
}

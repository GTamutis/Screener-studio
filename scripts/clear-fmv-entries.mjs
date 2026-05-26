/**
 * One-off: delete all rows from fmv_entries (uses .env.local Supabase admin).
 * Usage: node scripts/clear-fmv-entries.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvLocal() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
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
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: before, error: listErr } = await supabase
  .from("fmv_entries")
  .select("id, client_name, country, created_at");

if (listErr) {
  console.error("Could not list entries:", listErr.message);
  process.exit(1);
}

const count = before?.length ?? 0;
if (count === 0) {
  console.log("fmv_entries is already empty.");
  process.exit(0);
}

console.log(`Deleting ${count} FMV entr${count === 1 ? "y" : "ies"}:`);
for (const row of before ?? []) {
  console.log(`  - ${row.client_name} (${row.country}) ${row.id}`);
}

const { error: delErr } = await supabase
  .from("fmv_entries")
  .delete()
  .not("id", "is", null);

if (delErr) {
  console.error("Delete failed:", delErr.message);
  process.exit(1);
}

console.log("Done. fmv_entries cleared.");

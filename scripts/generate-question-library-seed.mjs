import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const inputPath = join(root, "supabase/seed/question_library_data.json");
const outputPath = join(root, "supabase/migrations/006_question_library_seed.sql");

const { questions, meta } = JSON.parse(readFileSync(inputPath, "utf8"));

function sqlString(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlTextArray(value) {
  if (!value?.length) return "null";
  return `array[${value.map((item) => sqlString(item)).join(", ")}]::text[]`;
}

function sqlJsonb(value) {
  if (value === null || value === undefined) return "null";
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function sqlBoolean(value) {
  return value ? "true" : "false";
}

const rows = questions.map((q) => {
  const cols = [
    sqlString(q.id),
    sqlString(q.question_text),
    sqlString(q.question_type),
    sqlJsonb(q.answer_options ?? []),
    sqlString(q.category),
    sqlTextArray(q.tags),
    sqlTextArray(q.sector),
    sqlTextArray(q.methodology),
    sqlString(q.language ?? "en"),
    q.notes ? sqlString(q.notes) : "null",
    sqlBoolean(q.is_locked ?? true),
    sqlString(q.status ?? "approved"),
    "null",
    "null",
  ];
  return `  (${cols.join(", ")})`;
});

const sql = `-- Seed question library (${questions.length} questions, data v${meta.version})
-- Source: supabase/seed/question_library_data.json

-- JSON includes grid questions; extend enum before insert
alter table question_library
  drop constraint if exists question_library_question_type_check;

alter table question_library
  add constraint question_library_question_type_check
  check (
    question_type in (
      'single',
      'multi',
      'open',
      'numeric',
      'scale',
      'statement',
      'grid'
    )
  );

insert into question_library (
  display_id,
  question_text,
  question_type,
  answer_options,
  category,
  tags,
  sector,
  methodology,
  language,
  notes,
  is_locked,
  status,
  approved_by,
  approved_at
)
values
${rows.join(",\n")}
on conflict (display_id) where display_id is not null
do update set
  question_text = excluded.question_text,
  question_type = excluded.question_type,
  answer_options = excluded.answer_options,
  category = excluded.category,
  tags = excluded.tags,
  sector = excluded.sector,
  methodology = excluded.methodology,
  language = excluded.language,
  notes = excluded.notes,
  is_locked = excluded.is_locked,
  status = excluded.status,
  updated_at = now();
`;

writeFileSync(outputPath, sql, "utf8");
console.log(`Wrote ${questions.length} rows to ${outputPath}`);

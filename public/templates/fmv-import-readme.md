# FMV bulk import — spreadsheet template

Use **`fmv-import-template.csv`** (open in Excel or Google Sheets). Save as `.xlsx` if you prefer; column headers must stay exactly as below.

## Columns

| Column | Required | Format / rules |
|--------|----------|----------------|
| `client_name` | Yes | Text |
| `country` | Yes | Must match the workspace country list exactly (e.g. `United Kingdom`, `Germany`, not `UK` or `DE`) |
| `project_target` | Yes | Text (study / wave / target description) |
| `methodology` | No | Text (e.g. CATI, CAWI); leave empty if unknown |
| `currency_code` | Yes | 3-letter ISO 4217 (e.g. `GBP`, `EUR`, `USD`) |
| `hourly_rate_local` | Yes | Positive number, local currency per hour |
| `effective_date` | Yes | `YYYY-MM-DD` — date used for ECB/Frankfurter FX (not “added to database” date). Cannot be in the future. |

## Not in the file (computed on import)

- USD / GBP / EUR hourly rates and `fx_rate_date` are calculated from `hourly_rate_local`, `currency_code`, and `effective_date` when rows are imported.

## Tips

- One row per FMV record; no merged cells or extra header rows.
- Dates as `2025-03-15`, not `15/03/2025`.
- Delete the two example rows before sending your real data.
- Countries must match **Projects → country picker** labels in the app.

Import UI is not wired yet; share a filled sheet when ready and we can run a one-off import or add upload in the app.

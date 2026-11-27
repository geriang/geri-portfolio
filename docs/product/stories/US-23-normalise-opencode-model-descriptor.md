# US-23: Normalise the opencode model descriptor

Status: approved

## Story
As a site owner, I want the importer to store a short, stable model name for every opencode message, so that the activity API and the heatmap group and filter usage by one value per model instead of by raw JSON descriptors.

## Requirements
FR: FR-8, FR-12, FR-17. BR: BR-5. NFR: NFR-5. ADR: ADR-3.

Origin: defect found when the US-3 importer first ran on the owner's real opencode database (counts and shapes only, no values recorded here). In the real `activity.db`, `usage_event.model` held a raw JSON descriptor shaped like an object with an `id` field and a `providerID` field, not a short model name. There were 13 distinct values, up to 78 characters long, for what is a much smaller set of models. They contained no session text, so NFR-5 passed on real data. Cause: the adapter takes `data.model` or the session's `model` column as is; the US-3 design and generated fixture assumed a plain string and no real database was read when it was designed. Nothing reads `model` yet, so nothing is broken today, but US-4 must not group by raw JSON.

## Acceptance criteria
- AC-1: Given a generated fixture message whose model is the JSON descriptor shape (an object with `id` and `providerID`, invented values, delivered as a JSON string), when it is imported, then `usage_event.model` is a short stable name of the form `<providerID>/<id>` with no JSON braces or quotes, and two descriptors for the same id and providerID that differ only in key order or extra fields produce the same stored value. The same holds when the model comes from the session's `model` column instead of the message data. (Verified by: Jest adapter and import tests over the generated fixture; FR-8, FR-12, BR-5.)
- AC-2: Given a message whose model is a plain string (the old shape), when it is imported, then `usage_event.model` is that string unchanged. (Verified by: Jest test; FR-12, BR-5.)
- AC-3: Given a descriptor that cannot be parsed, or parses but has no usable `id`, when it is imported, then the import still succeeds, `usage_event.model` holds a fixed safe fallback value, and any error or log text produced carries only the value's type and length, never the value itself. (Verified by: Jest test with a marker string inside the bad descriptor; the marker must not appear in `activity.db`, in `import_run.error`, in thrown error messages or in captured log or stdout output; NFR-5, FR-12.)
- AC-4: Given rows already imported with the raw JSON in `model`, when the import runs again over a window that includes their source messages, then each such row is updated to the normalised name through the existing upsert on (tool, source_id), the row count and all token and prompt totals change by 0, and only `model` changes. (Verified by: Jest test that seeds `activity.db` with raw-JSON rows, re-runs the import, and compares counts, totals and model values; FR-17, ADR-3.) The story also records, in its Notes, whether a one-off clean-up is needed (see Notes).
- AC-5: Given the generated test fixture, when the tests run, then the fixture includes the real descriptor shape with invented values (for example provider `example-provider`, id `example-model-a`) next to the existing plain-string case, and a repository scan of the changed files finds no real model name, provider name, prompt text or path. (Verified by: Jest tests using the updated fixture; review of the diff against the alias note at the top of the backlog; NFR-5, BR-5.)
- AC-6: Manual (user): Given the fix is merged and a fresh scratch import of the owner's real opencode database has been run, when a read-only query counts `usage_event` rows whose `model` contains `{` or `}`, then the count is 0. Report counts only (rows checked, distinct `model` values before and after, rows with braces), never the values. (FR-8, NFR-5.)

## Out of scope
- Task rules and `task_type` coverage (see Notes), the classifier and any rules config change.
- Other adapters (US-17, US-18).
- Any change to the API or the `usage_event` schema.
- Opening or reading the owner's real database inside the container; AC-6 is run by the owner.

## Dependencies
US-3 (merged). US-4 depends on this story.

## Design needed
no: a small change inside the existing opencode adapter and its fixture; the tech lead may say otherwise if the normalising helper should be shared by the future Agent-tool and Chat-tool adapters.

## Branch name
agent/us-23-normalise-opencode-model-descriptor

## Type
backend

## UX needed
no: no screens are added or changed.

## Notes
- Where it lives: `backend/src/import/adapters/opencodeAdapter.ts`, in `mapRow`, where the model is taken from `data.model` or the session's `model` column. A model value that is already a parsed JSON object (not a string) should be handled the same way as a JSON string; the implementer should check this against the fixture rather than assume the real shape.
- Output format: `<providerID>/<id>` when both are present; the `id` alone when `providerID` is missing; a plain string is stored as is. The tech lead or implementer picks the fixed fallback value (for example a constant such as `unknown`) and documents it. Only a missing or empty model remains a fail-fast error as in US-3; that behaviour is not changed here.
- Source ids do not include the model (derived ids hash tool, session, type, time and token counts), so re-importing never creates new rows; it only rewrites `model` through the existing `ON CONFLICT(tool, source_id) DO UPDATE`.
- One-off clean-up: the normal daily run only re-reads the last 7 days. Rows older than the window that were imported with raw JSON are corrected only by re-running the import with a larger `--window-days` (existing flag) that covers them, or by deleting the scratch `activity.db` and re-importing. A scratch database is the only thing known to exist today and no production data is served yet, so the owner can simply re-import; no separate migration script is planned. If the owner wants one, it is a new story.
- Logging: error or log text may state the value's type (for example string or object) and its length only.
- Related but not in this story: the real data showed only 3 distinct `task_type` values, mostly `Uncategorised`. The architecture already flagged this risk; the backlog risk list now repeats it and an open question asks whether the owner wants a task-rule story.

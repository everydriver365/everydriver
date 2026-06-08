
# Daily database backup to Backblaze B2

Automated nightly export of every `public` table to a Backblaze B2 bucket, kept for 90 days.

## How it will work

```text
 pg_cron (03:00 UTC daily)
        │
        ▼
 edge function: backup-database-to-b2
        │  for each public table
        ▼  SELECT * → NDJSON.gz
 Backblaze B2 (S3-compatible API)
   backups/YYYY-MM-DD/<table>.ndjson.gz
   backups/YYYY-MM-DD/_manifest.json
        │
        ▼
 Lifecycle rule on B2 bucket
   auto-delete objects older than 90 days
```

## What gets backed up

- Every table in the `public` schema (~290 tables) as gzipped NDJSON, one file per table.
- A `_manifest.json` per run listing tables, row counts, byte sizes, duration, and any errors.
- Schema is implicit in the column names (NDJSON). Storage buckets are out of scope (per your choice).

## Setup steps

### 1. You create a Backblaze B2 bucket
- Sign in at backblaze.com → create a **Private** bucket (e.g. `dsm-db-backups`).
- Create an **Application Key** scoped to that bucket with read+write+delete.
- Note: `keyID`, `applicationKey`, `S3 endpoint` (e.g. `s3.us-west-004.backblazeb2.com`), `bucket name`.
- In the bucket settings, add a **Lifecycle Rule**: "Keep only the last version of the file" → "Hide files after 90 days" → "Delete hidden files after 1 day". This enforces the 90-day retention without any code running.

### 2. I add secrets (after your go-ahead)
- `B2_KEY_ID`
- `B2_APPLICATION_KEY`
- `B2_BUCKET`
- `B2_ENDPOINT` (e.g. `s3.us-west-004.backblazeb2.com`)

### 3. I build edge function `backup-database-to-b2`
- Auth: protected by a shared `BACKUP_CRON_SECRET` header so only pg_cron can invoke it.
- Lists all `public` tables via `information_schema`.
- For each table: paginates `SELECT * ORDER BY ctid` in 5,000-row chunks, streams them as NDJSON through `CompressionStream('gzip')`, and PUTs to B2 using S3 SigV4 (`s3://<bucket>/backups/<YYYY-MM-DD>/<table>.ndjson.gz`).
- Writes a `_manifest.json` summary at the end.
- Logs progress + failures so a run that breaks halfway is visible in edge function logs.

### 4. Schedule with pg_cron
- One migration: `cron.schedule('daily-b2-backup', '0 3 * * *', ...)` calling the edge function via `net.http_post` with the shared secret header.

### 5. Settings UI (small)
- New "Database Backups" card in Admin → Settings showing: last run timestamp, last manifest summary, button to **Run backup now**.
- Reads `_manifest.json` from B2 via a thin edge function (`list-b2-backups`) using the same credentials.

## Technical notes

- Backblaze B2 fully supports the AWS S3 API, so the edge function uses standard SigV4 PUTs — no B2-specific SDK needed.
- NDJSON+gzip keeps the dump streamable inside the 150 s edge function limit. If total runtime is at risk, the function batches tables and self-invokes for the remainder (cursor stored in a small `backup_runs` table).
- A tiny `backup_runs` table (id, started_at, finished_at, status, manifest_path, error) records every attempt for the UI.
- No restore tooling is built in this pass — restoring is a manual `psql` + `jq` job from the NDJSON files. Happy to add a one-click restore later if you want.
- No changes to mobile UI. No changes to existing payment, auth, or calendar code.

## Out of scope (ask if you want them added)
- Storage bucket file backup.
- Encrypted backups (B2 server-side encryption is on by default; client-side encryption not included).
- Off-site mirroring to a second provider.

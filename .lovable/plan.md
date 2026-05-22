## PART 1 — Dead code (correction to investigation)

`XeroExport.tsx` is **not** unused. It is still imported and rendered:

- `src/pages/instructor/InstructorIntegrationsHub.tsx:9` — `import { XeroExport } ...`
- `src/pages/instructor/InstructorIntegrationsHub.tsx:385` — rendered under the `"xero"` tab

Since `AccountingExport` (mounted on `InstructorAccounts.tsx`) supersedes it with all 4 platforms + live API sync, the safe cleanup is:

1. Open `InstructorIntegrationsHub.tsx`, remove the `XeroExport` import and replace the `tab === "xero"` branch with `<AccountingExport instructorId={instructorId} />` (single source of truth for CSV + sync).
2. Delete `src/components/instructor/XeroExport.tsx`.
3. Re-grep to confirm zero remaining references.

If you'd rather keep `InstructorIntegrationsHub` untouched, alternative is to leave `XeroExport.tsx` in place — say the word and I'll skip the delete.

## PART 2 — Mileage in accounting sync

Edit `supabase/functions/accounting-sync/index.ts` only.

**HMRC helper (inlined in the edge function — `src/lib/ukTax.ts` is a browser module and can't be imported into Deno):**
```ts
const KM_TO_MILES = 0.621371;
function hmrcMileageAllowance(miles: number, tierUsedMiles = 0): number {
  // 45p first 10,000 miles in tax year, 25p after
  const tier1Remaining = Math.max(0, 10000 - tierUsedMiles);
  const tier1 = Math.min(miles, tier1Remaining);
  const tier2 = Math.max(0, miles - tier1);
  return +(tier1 * 0.45 + tier2 * 0.25).toFixed(2);
}
```

For accuracy against the 10k threshold, query `mileage_logs` twice:
- `trip_type='business'` from **start of UK tax year (6 Apr)** up to `period_start - 1` → sum km → miles → `tierUsedMiles`.
- `trip_type='business'` for `[period_start, period_end]` → sum km → miles → period miles.

Compute `allowance = hmrcMileageAllowance(periodMiles, tierUsedMiles)`. If `periodMiles === 0` or `allowance === 0`, skip (no row).

**Post as a single expense line** when `sync_type` is `expenses` or `both`:

- description: `Business mileage ${period_start} to ${period_end} (${periodMiles.toFixed(1)} mi @ HMRC AMAP)`
- amount: `allowance`
- date: `period_end`
- category: `"Mileage"`

Reuse each platform's existing `formatExpense(...)` by passing a synthetic object `{ expense_date: period_end, amount: allowance, description, id: '<uuid-v4-generated>' }`. Use a generated UUID (not from DB) so each sync is unique.

Increment `totalSynced` only when the POST returns `res.ok`; on failure push to `errors` exactly like the existing expense loop.

**Account code mapping** — `platformConfigs.ts` has no `Mileage` key today. Add it to all four maps in `src/components/instructor/accounting-export/platformConfigs.ts`:

| Platform | Code |
|---|---|
| Xero | `410` (Motor Vehicle Expenses) |
| QuickBooks | `Car & Van Expenses` |
| FreeAgent | `Motor Expenses` |
| Sage | `7400` (Travelling) |

The edge function's own `getXeroCode` / `getQBOCategory` helpers also need a `Mileage` entry mirroring the above — those are duplicated in the edge function, not imported from the client config.

Read-only: no writes to `mileage_logs`.

## PART 3 — Mark expenses synced after live API push

**Migration (additive, nullable, no default):**
```sql
ALTER TABLE public.instructor_expenses
  ADD COLUMN last_synced_platform text;
```

**Edge function change** (`accounting-sync/index.ts`), inside the `expenses` loop, only when `res.ok`:
```ts
await supabase
  .from('instructor_expenses')
  .update({
    xero_synced: true,
    xero_sync_date: new Date().toISOString(),
    last_synced_platform: platform,
  })
  .eq('id', exp.id);
```

Notes:
- Despite the legacy `xero_*` column names, we set them for **every** platform — they're now generic "synced" flags, and `last_synced_platform` tells you which.
- Only set on per-row success; partial failures stay unmarked so a re-run picks them up.
- The mileage synthetic line is **not** persisted to `instructor_expenses`, so nothing to flag for it.
- Skip the update on the income loop (income comes from `scheduled_lessons`; no flag column).

## PART 4 — Verification

- `rg "XeroExport"` returns zero hits after cleanup.
- Edge function compiles; deploy `accounting-sync` and (if changed) `accounting-oauth` stays untouched.
- Manually invoke `accounting-sync` against a test instructor with no OAuth secrets → still 400s on "Not connected", proving no regression for unconfigured tenants.
- Confirm `last_synced_platform` column visible in `types.ts` after migration regenerates.
- Confirm `instructor_expenses.xero_synced` flips to `true` after a successful sync (DB check).
- No edits to: `AccountingSyncPanel`, `AccountingExport` body (only the swap into IntegrationsHub), `useAccountingConnection`, `InstructorTax.tsx`, payment bridges, `mileage_logs`.

## PART 5 — Deferred

- Registering OAuth apps with Xero/QBO/FreeAgent/Sage and adding `XERO_CLIENT_ID/SECRET`, `QBO_*`, `FREEAGENT_*`, `SAGE_*` runtime secrets — required before any instructor can actually connect. **Will request via `add_secret` only if/when you confirm.**
- Bridging real payment receipts (`pupil_payments` / GoCardless / Square / SumUp) → accounting income (current path uses lesson-completion as proxy).
- Backfilling `last_synced_platform` for historical CSV-exported rows (left null intentionally).
- Income/lesson rows getting a `synced` flag of their own.
- Splitting mileage into one line per month if a sync period spans multiple months.

## Files touched
- **edit** `src/pages/instructor/InstructorIntegrationsHub.tsx` (swap XeroExport → AccountingExport)
- **delete** `src/components/instructor/XeroExport.tsx`
- **edit** `supabase/functions/accounting-sync/index.ts` (mileage line + mark synced)
- **edit** `src/components/instructor/accounting-export/platformConfigs.ts` (Mileage category)
- **migration** add `instructor_expenses.last_synced_platform text`

Approve to proceed.
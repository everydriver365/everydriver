# Accounting Affiliate Signup

## PART 1 — site_settings check + storage decision

`site_settings` schema (queried live):
- `id uuid`, `setting_key text`, `setting_value text` (nullable), `setting_type text`, `label`, `description`, `display_order`, `created_at`, `updated_at`, `admin_notification_emails text[]`

It's a flat text key/value store — no jsonb, no `is_active`, no `updated_by`. The brief requires active/inactive toggle, updated_by audit, and unique-per-platform constraint. **Decision: create a dedicated table** `accounting_affiliate_links` (matches Step 2 fallback exactly).

## PART 2 — Migration

Create `accounting_affiliate_links`:
- `id uuid pk default gen_random_uuid()`
- `platform text not null` with CHECK in (`xero`,`quickbooks`,`freeagent`,`sage`)
- `affiliate_url text`
- `is_active boolean not null default false`
- `updated_at timestamptz not null default now()`
- `updated_by uuid` (no FK to auth.users per project convention)
- Unique on `platform`
- RLS enabled
  - SELECT/INSERT/UPDATE/DELETE: `has_role(auth.uid(), 'admin')` only
  - No instructor-facing policy on this table — instructors will read via a SECURITY DEFINER RPC `get_active_affiliate_links()` returning only `platform, affiliate_url` for rows where `is_active = true AND affiliate_url IS NOT NULL`
- Trigger to set `updated_at` via existing `set_updated_at()`
- Seed 4 rows (one per platform) inactive with NULL URL so admin UI shows all four immediately

Create `affiliate_link_clicks`:
- `id uuid pk`
- `instructor_id uuid not null` (no FK per project pattern, but indexed)
- `platform text not null` (same CHECK)
- `affiliate_url text`
- `clicked_at timestamptz not null default now()`
- RLS:
  - INSERT: caller's `get_instructor_id_for_user(auth.uid()) = instructor_id`
  - SELECT: `has_role(auth.uid(), 'admin')`
- Index on `(platform, clicked_at desc)` and `(instructor_id)`

## PART 3 — Admin UI

New page `src/pages/admin/AccountingPartners.tsx` + route `/admin/accounting-partners` in `src/routes/adminRoutes.tsx` (ProtectedAdminRoute).

Add nav entry in `src/components/admin/AdminLayout.tsx` under the **Settings** group: `{ key: "accounting-partners", label: "Accounting Partners", icon: Link2 }` and wire `accounting-partners` in AdminPortal's section switcher (will read the existing pattern; if AdminPortal uses key-based routing it gets a case, otherwise it links to the standalone route).

Page UI:
- Header card explaining purpose
- 4 rows, one per platform (Xero, QuickBooks, FreeAgent, Sage), each with:
  - Coloured icon/badge per platform
  - Text input for `affiliate_url` (https:// validation, zod)
  - `Switch` for `is_active`
  - Last updated timestamp + updater email (joined via a separate fetch of admin profile or just shows uuid → look up display via `auth.users` not allowed, so show "Updated {time ago}" only; updater email out of scope unless a profiles table exists — defer email lookup if not trivial)
- Single "Save changes" button — upserts all 4 rows in one mutation (RPC or batched upsert with `onConflict: 'platform'`), setting `updated_by = auth.uid()`
- Toast on success/failure
- Loads existing rows on mount

## PART 4 — Instructor signup prompt

Edit `src/components/instructor/accounting-export/AccountingSyncPanel.tsx`:
- Add a new hook `useAffiliateLinks()` that calls the `get_active_affiliate_links` RPC once and caches via react-query (single query covering all platforms — not per panel instance; key `['affiliate-links']`)
- In `AccountingSyncPanel`, when `!connected` AND `affiliateUrlForPlatform` exists: render a new block below the existing "Connect" CTA:
  - Divider + small heading "Don't have {Platform} yet?"
  - One-line description "Get started with {Platform} using our partner link"
  - Button (blue `#2952b3`, white text, full width, `gap-2`, ExternalLink icon) "Sign up to {Platform} →" — `onClick` logs click then `window.open(url, '_blank', 'noopener,noreferrer')`
- When `connected`: no signup block (existing render is already gated by `if (!connected)` for the empty state; the new block sits inside that same branch, so connected instructors never see it)
- If no active affiliate URL for the platform: render nothing (the block is conditional)

No changes to `InstructorIntegrationsHub.tsx`, `AccountingExport.tsx`, `accounting-oauth`, or `accounting-sync`.

## PART 5 — Click tracking

In the same `AccountingSyncPanel.tsx` click handler:
```ts
await supabase.from('affiliate_link_clicks').insert({
  instructor_id: instructorId,
  platform,
  affiliate_url: url,
});
window.open(url, '_blank', 'noopener,noreferrer');
```
Failure to log does not block the redirect (fire-and-forget try/catch, open URL regardless).

## PART 6 — Verified clean / Deferred

Verified untouched:
- `accounting-oauth/index.ts`, `accounting-sync/index.ts`
- `AccountingExport.tsx`
- `src/lib/ukTax.ts`, `useInstructorTaxSummary.ts`, all tax UI
- All existing admin pages

Deferred:
- Click analytics dashboard for admin (table exists; no UI in this pass)
- Showing updater email in admin UI (requires profile lookup; out of scope)
- Localised copy / i18n strings for the signup block

## Technical notes

Files touched:
- New migration (table + RLS + RPC + seed)
- New: `src/pages/admin/AccountingPartners.tsx`
- New: `src/hooks/useAffiliateLinks.ts`
- Edit: `src/routes/adminRoutes.tsx` (add route)
- Edit: `src/components/admin/AdminLayout.tsx` (sidebar entry)
- Edit: `src/pages/AdminPortal.tsx` (section render switch, if key-based)
- Edit: `src/components/instructor/accounting-export/AccountingSyncPanel.tsx` (signup block + click log)

## Goal

Build an in-app wizard that walks the user through adding the 3 DNS records (1 TXT + 2 NS) required to delegate `notify.everydriver.co.uk` to Lovable, with one-click copy, per-record checkmarks, and live verification.

## Where it lives

New route: `/admin/email-domain-setup` (admin-only, reachable from Admin sidebar → Settings → "Email domain setup", and auto-opened as a banner CTA from the existing Emails area when domain status is `awaiting_dns` or `active_provisioning`).

Files:
- `src/pages/admin/EmailDomainSetup.tsx` — page shell + step state
- `src/components/admin/email-setup/DnsRecordCard.tsx` — single record row (Type / Host / Value + Copy + ✓)
- `src/components/admin/email-setup/SetupProgress.tsx` — checklist sidebar (Step 1 Add records → Step 2 Verify → Step 3 Done)
- `src/components/admin/email-setup/RegistrarHints.tsx` — collapsible "How to add these at GoDaddy / 123-reg / Cloudflare / Namecheap"
- `src/hooks/useEmailDomainSetup.ts` — fetches current domain + records via `email_domain--check_email_domain_status`, polls every 15s while on page
- Route entry added to `src/routes/adminRoutes.tsx`
- Sidebar link added to `src/components/admin/AdminLayout.tsx`

## UX flow

```text
┌─ Step 1: Add 3 DNS records at your registrar ─────────────┐
│                                                            │
│  [✓] TXT   Host: _lovable_email_verify.notify             │
│            Value: lovable_verify=7xa...           [Copy]   │
│                                                            │
│  [ ] NS    Host: notify                                    │
│            Value: ns7.lovable.cloud               [Copy]   │
│                                                            │
│  [ ] NS    Host: notify                                    │
│            Value: ns8.lovable.cloud               [Copy]   │
│                                                            │
│  ▸ How do I add these? (registrar guides)                 │
│                                                            │
│  [ I've added all 3 records → Verify ]                    │
└────────────────────────────────────────────────────────────┘
```

Behaviour:
- Each record row has its own "Copied ✓" toast + a local "marked added" checkbox (persisted to localStorage so refresh keeps state).
- "Verify" button calls `email_domain--check_email_domain_status` and shows result inline: `awaiting_dns` → "Still propagating, we'll keep checking" with auto-poll; `active` → confetti + green Step 3 panel + auto-deploy `auth-email-hook` if not yet deployed; `provisioning_failed` → red panel with "Rerun setup" button.
- Progress sidebar shows: ① Records added (auto when all 3 checked) → ② DNS verified (from API) → ③ Emails activated.
- Plain-English explainer at top: "You don't need to create a `notify` subdomain manually — adding these 2 NS records IS the subdomain. Your root domain and existing email are unaffected."

## Data source

Use existing tool: `email_domain--check_email_domain_status` returns the FQDN, the TXT token, and the 2 NS targets. No new edge function or table required. Wizard reads, never writes DNS — registrar action stays with the user.

## Technical notes

- Auth: wrapped in `<ProtectedAdminRoute>` like other admin pages.
- Styling: existing admin portal tokens (`#F4F7F6` bg, `rounded-2xl` cards, indigo `#2D3FE7` accent per desktop portal theme).
- Copy: `navigator.clipboard.writeText` + sonner toast.
- Polling: 15s interval via `setInterval` while status ≠ `active`, cleared on unmount.
- Local checkmarks key: `email-dns-setup:${domain}:${recordIndex}`.
- No DB migration needed.
- No changes to mobile layouts (per project rules).

## Out of scope

- DNS record auto-creation (we don't touch the registrar).
- Multi-domain selector (single-domain flow; if multiple exist, deep-link with `?domain=` query).
- Email template editing (already covered elsewhere).

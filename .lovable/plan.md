## Goal
Attach an existing Ryft sub-account to instructor **Ken D** (`info@drive365.co.uk`, id `c9843b58-6edb-4b97-8238-65d725e30aea`) so payments split to his account.

## What I need from you
The Ryft **accountId** (looks like `ac_...`) for Ken's sub-account. Paste it in the next message.

## Steps
1. You send the Ryft accountId.
2. I update the `instructors` row for Ken D:
   - `ryft_account_id` = the ID you provide
   - `ryft_account_status` = `active`
   - `ryft_payouts_enabled` = `true`
3. Verify with a quick read-back of those three columns.

## Notes
- No code or schema changes — this is a single data update.
- If payouts aren't actually enabled yet on Ryft's side, set the status flags to `false` instead and we'll flip them once Ryft confirms. Tell me if that applies.

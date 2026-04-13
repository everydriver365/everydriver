

## Plan: Fix Radius Poller Authentication

### Problem
The `radius-poller` function fails with `401 Invalid Token` because the `RADIUS_REFRESH_TOKEN` has expired. The API key from Kinesis Fleet Pro (9631c2b4...) is the same type as `RADIUS_API_TOKEN` — it cannot authenticate on its own without the OAuth refresh flow.

### Solution: Update RADIUS_API_TOKEN + Get Fresh Refresh Token

**Step 1: Update `RADIUS_API_TOKEN` with the newer "365 v2" key**
The "365 v2" key (9631c2b4...) may be newer/more current than whatever is stored as `RADIUS_API_TOKEN`. Update the secret to use this key.

**Step 2: Get a fresh refresh token from you**
You need to log into Kinesis Fleet Pro and capture a fresh refresh token. Here's how:
1. Open your browser dev tools (F12) → Network tab
2. Log into `kinesisfleetpro.com`
3. Look for the login/auth response — it will contain a `refresh` token
4. Share that token and I'll update `RADIUS_REFRESH_TOKEN`

**Step 3: (Alternative) Try username/password auth**
Instead of manually capturing refresh tokens, I can add a username/password login flow to the poller. This would:
- Add `RADIUS_USERNAME` and `RADIUS_PASSWORD` secrets
- Call the Kinesis login endpoint to get fresh access + refresh tokens automatically
- Eliminate the need to manually refresh tokens ever again

### Recommendation
**Step 3 is the permanent fix.** With username/password auth, the poller can always get a fresh token on its own — no more manual refresh token updates.

### Technical Details

Add a new `authenticateWithCredentials()` function to `radius-poller/index.ts`:
```text
POST https://www.velocityfleet.com/vapi/v1/accounts/users/oauth2/login/
Headers: API-Token, Content-Type: application/json
Body: { "username": "...", "password": "..." }
Response: { "access": "...", "refresh": "..." }
```

Auth priority order:
1. Try cached session (memory → DB)
2. Try refresh token flow
3. Fall back to username/password login
4. Cache new tokens in `radius_session_cache`

New secrets needed: `RADIUS_USERNAME`, `RADIUS_PASSWORD`

| Action | Detail |
|--------|--------|
| Secret | Update `RADIUS_API_TOKEN` → 365 v2 key |
| Secret | Add `RADIUS_USERNAME` |
| Secret | Add `RADIUS_PASSWORD` |
| Modify | `supabase/functions/radius-poller/index.ts` — add credential-based auth |


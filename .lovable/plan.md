
# Fix Missing Email Display for Google Calendar Connection

## Problem
The Google Calendar connection status shows a blank/undefined email because the `email` field in the `instructor_calendar_tokens` table is `null` for existing connections that were made before the email-saving logic was added.

## Solution
Modify the `checkConnection` action in the `google-oauth` edge function to automatically fetch and save the email when it's missing. This is a "self-healing" approach that fixes existing records without requiring users to reconnect.

---

## Implementation

### 1. Update the Edge Function (`supabase/functions/google-oauth/index.ts`)

Modify the `checkConnection` action (around lines 295-327) to:

1. After fetching the token data, check if `email` is null/missing
2. If missing and we have a valid access token, call Google's userinfo API
3. Update the database with the fetched email
4. Return the email in the response

**Changes to make:**

```typescript
// Inside the checkConnection action, after fetching tokenData:

// If email is missing, fetch it from Google and update the record
let email = tokenData.email;
if (!email && tokenData.access_token) {
  try {
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
      email = userInfo.email;
      
      // Save the email for future requests
      if (email) {
        await supabase
          .from("instructor_calendar_tokens")
          .update({ email })
          .eq("instructor_id", instructorId)
          .eq("provider", "google");
      }
    }
  } catch (e) {
    console.error("Failed to fetch email from Google:", e);
  }
}
```

---

## Technical Details

| Aspect | Detail |
|--------|--------|
| File to modify | `supabase/functions/google-oauth/index.ts` |
| Action affected | `checkConnection` (lines 295-327) |
| API used | Google OAuth2 userinfo endpoint |
| Fallback | If fetch fails, continues without email (graceful degradation) |

### Why This Approach?
- **No user action required** - fixes itself on next page load
- **One-time operation** - once email is saved, subsequent checks skip the fetch
- **Backwards compatible** - doesn't break anything for new connections
- **Minimal code change** - localized to one action in one file

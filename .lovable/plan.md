

## Meta Data Deletion Callback

Meta requires a **Data Deletion Callback URL** — an endpoint that receives POST requests when a user wants their data deleted, and returns a confirmation with a status check URL.

### What needs to happen

**1. Create a new edge function: `meta-data-deletion`**

This endpoint will:
- Accept POST requests from Meta containing a signed request with the user's app-scoped ID
- Decode and verify the signed request using the Meta App Secret
- Delete any stored data associated with that user ID (WhatsApp messages, conversations, etc.)
- Return a JSON response with a `url` (status check page) and `confirmation_code`

**2. Add Meta App Secret**

The function needs `META_APP_SECRET` to verify the signed request from Meta. You'll need to provide this from your Meta App Dashboard → Settings → Basic → App Secret.

**3. Create a simple data deletion status page**

A static page at `/data-deletion/` that users can visit to confirm their data has been processed.

### URLs for Meta

Once built, your **Data Deletion Callback URL** will be:

```
https://qyqeibovdhyohkfagujv.supabase.co/functions/v1/meta-data-deletion
```

### Technical details

- The edge function parses Meta's `signed_request` parameter (base64url-encoded HMAC-SHA256 signature + JSON payload)
- It extracts the `user_id` (app-scoped ID) and deletes matching records from relevant tables (e.g. `whatsapp_messages`, `whatsapp_conversations`)
- Returns `{ url: "https://everydriver.lovable.app/data-deletion/", confirmation_code: "<uuid>" }` as Meta requires
- Config entry added to `supabase/config.toml` with `verify_jwt = false`


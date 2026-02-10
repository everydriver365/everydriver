

# Fix Quartix Authentication — Add Application Parameter

## Problem
The Quartix QWS v2 API requires an **Application** parameter in the auth request. Our edge functions only send CustomerID, UserName, and Password — missing the Application name, which is why authentication returns a 422 error.

## Solution
Add the Application parameter to the auth requests in all three Quartix edge functions, and store the credentials correctly.

## Steps

### Step 1: Store Application Name as a Secret
- Add a new secret `QUARTIX_APPLICATION` with value `Threesixfive.app`

### Step 2: Update `quartix-poller` auth function
- Add `Application: applicationName` to both the JSON and form-encoded auth request bodies

### Step 3: Update `quartix-trips` auth function
- Add `Application: applicationName` to the form-encoded auth request body

### Step 4: Update `quartix-route` auth function
- Add `Application: applicationName` to the form-encoded auth request body

### Step 5: Deploy and Test
- Deploy all three edge functions
- Call `quartix-poller` to verify authentication now succeeds
- Confirm vehicle data flows into the database

## Technical Details

In each edge function's `authenticate()` function, the auth body will change from:

```
CustomerID, UserName, Password
```

to:

```
CustomerID, UserName, Password, Application
```

The `Application` value (`Threesixfive.app`) will be read from the `QUARTIX_APPLICATION` secret.

All three files affected:
- `supabase/functions/quartix-poller/index.ts`
- `supabase/functions/quartix-trips/index.ts`
- `supabase/functions/quartix-route/index.ts`



## Square OAuth redirect_uri error

### What I checked
- The app is already sending a hardcoded live callback URL from both places in the flow:
  - `src/components/instructor/SquareConnectSettings.tsx`
  - `src/pages/instructor/SquareCallback.tsx`
- The exact URI in code is:
  - `https://everydriver.lovable.app/instructor/square-callback`
- The OAuth function uses `SQUARE_ENVIRONMENT` to choose live vs sandbox. Your current setup is intended to use the live Square endpoint.

### Likely root cause
This error is most likely not a frontend bug now. It usually means Square is rejecting the callback because one of these is true:
1. The redirect URL is not registered in the **Production** OAuth settings
2. It is registered with a tiny mismatch (slash, spelling, protocol, path)
3. `SQUARE_APPLICATION_ID` and `SQUARE_OAUTH_SECRET` are from a different Square app than the one where the redirect URL was added
4. Live credentials are mixed with sandbox app settings

### Plan
1. Verify the Square app you are editing is the exact same app that matches your stored:
   - `SQUARE_APPLICATION_ID`
   - `SQUARE_OAUTH_SECRET`

2. In that same Square app, open the **Production** OAuth settings and add this exact redirect URL:
   - `https://everydriver.lovable.app/instructor/square-callback`

3. Confirm there is no variation such as:
   - `http` instead of `https`
   - extra slash at the end
   - preview URL instead of published URL
   - different path or subdomain

4. Re-test from the published site, not the preview site:
   - `https://everydriver.lovable.app`

5. If it still fails after the dashboard values are confirmed, then the next implementation step is to add temporary debug output in the OAuth starter function so we can confirm:
   - which Square application ID is being used
   - which environment is active
   - the exact authorize URL being generated

### Expected outcome
Most likely fix: update Square dashboard configuration, not app code.

### Technical note
From the code review, the current app behavior is already correct: it sends the live published callback URL, so the remaining mismatch is almost certainly in the Square app configuration or credential pairing.

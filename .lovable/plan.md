## Problem

On `everydriver.lovable.app` (desktop and phone), visiting `/` redirects to the DSM instructor login instead of showing the EveryDriver learner marketing homepage. It looks "phone-only" because on a phone there is no other DSM tab open, so the redirect is more obvious.

## Root cause

`src/lib/appVariant.ts` → `getAppVariant()` contains:

```ts
if (isEveryDriverHost()) return "instructor";
```

`everydriver.lovable.app` matches `isEveryDriverHost()`, so the variant becomes `"instructor"`.

`src/components/ConditionalHome.tsx` checks the variant first:

```ts
if (variant === "instructor") {
  return <AppEntryRedirect authedTo="/instructor" loginTo="/instructor-app/login" />;
}
…
if (isEveryDriverHost()) {
  return <EveryDriverIndex />; // never reached
}
```

So the EveryDriver learner homepage branch is unreachable. This contradicts the comment immediately above it ("EveryDriver is the learner-facing brand, so it must NOT redirect here").

## Fix

One-line change in `src/lib/appVariant.ts`: remove the `isEveryDriverHost()` → `"instructor"` mapping. EveryDriver host should resolve as `"marketing"`, letting `ConditionalHome` fall through to the `<EveryDriverIndex />` learner marketing homepage.

```diff
- if (isEveryDriverHost()) return "instructor";
```

Path-based detection (`/instructor/*` → `"instructor"`) is preserved, so the actual DSM instructor app still works at `everydriver.lovable.app/instructor` and `/instructor-app/login`.

## Scope

- File: `src/lib/appVariant.ts` (delete one line + adjacent comment if any).
- No layout, copy, or styling changes.
- No changes to `DomainRouter` cross-domain redirects, `isEveryDriverHost`, or `ConditionalHome`.

## Verification

- `everydriver.lovable.app/` (mobile + desktop) → renders `EveryDriverIndex` (learner marketing).
- `everydriver.lovable.app/instructor` → still loads instructor portal (auth-gated).
- `everydriver.lovable.app/instructor-app/login` → still loads DSM login when navigated to directly.
- Custom domains (`everydriver.co.uk`, `drive365.co.uk`, whitelabel) unaffected.

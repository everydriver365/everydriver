## Goal
Make every Drive365 marketing page use the same white `Drive365Header` currently used by `/courses`, instead of the legacy navy `Header`.

## Change
Single edit in `src/components/layout/MainLayout.tsx`: replace the `useDrive365Header` route-allowlist logic so the white `Drive365Header` is the default for the learner-app surface, and the legacy `Header` is no longer rendered there.

```ts
// before
const DRIVE365_HEADER_ROUTES = ["/courses"];
const useDrive365Header = DRIVE365_HEADER_ROUTES.some(...);
{useDrive365Header ? <Drive365Header /> : <Header />}

// after
<Drive365Header />
```

This automatically updates every page that wraps itself in `MainLayout`, including:
- `/drive365`, `/drive365/franchise/*`
- `/theory`, `/about`, `/faqs`, `/help`, `/test-swap`, `/intensives`, `/semi-intensive`
- `/franchise` and `/franchise/*` (healthcare, bonus, technology, whats-included)
- `/reviews`, `/news`, `/news/*`
- `/courses` (unchanged behaviour)

No per-page edits needed — they all already use `MainLayout`.

## Out of scope
- EveryDriver (`/everydriver/*`) pages, whitelabel domains, instructor SaaS marketing, mini-sites, and pupil/admin portals all use different layouts and are not Drive365 surfaces.
- Mobile layout is unchanged — `Drive365Header` has its own responsive behaviour.
- `Header.tsx` stays in the repo (still imported by `MainLayout` types and possibly other surfaces); only its usage inside `MainLayout` is removed.

## Verification
After the change, navigate to `/drive365/franchise`, `/theory`, `/about`, `/test-swap`, `/courses` and confirm the same white Drive365 nav appears on all.
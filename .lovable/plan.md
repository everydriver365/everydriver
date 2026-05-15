## Why the Test Swap link is missing

The shared `Header.tsx` has `{ href: "/test-swap", label: "Test Swap" }` already. **But** on Drive365 routes, `Header.tsx` short-circuits and renders the dedicated `Drive365Header` component (line 44–46), which has its own hard-coded `NAV_LINKS` array that doesn't include Test Swap.

The shared `Footer.tsx` already has the Test Swap link, so the footer is fine on every site. The link is also visible on EveryDriver / whitelabel / non-Drive365 routes through `Header.tsx`. Only the Drive365 top nav is missing it.

## Fix

**File:** `src/components/layout/Drive365Header.tsx`

Add Test Swap to `NAV_LINKS` (line 6–12), placed between Theory practice and Franchise so it sits prominently:

```ts
const NAV_LINKS = [
  { href: "/courses", label: "Courses", hasDropdown: true },
  { href: "/theory", label: "Theory practice" },
  { href: "/test-swap", label: "Test Swap" },
  { href: "/drive365/franchise", label: "Franchise" },
  { href: "/about", label: "About" },
  { href: "/help", label: "Help" },
];
```

That's the only change needed — the existing render loops handle desktop and mobile menu rendering automatically.
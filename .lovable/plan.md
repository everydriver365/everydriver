## Goal
Use the June 7 light-blue EveryDriver logo (`src/assets/everydriver-logo-jun7.png.asset.json`) in the site **header** and **footer** — matching the one already shown in the hero.

## Change
Single source: `src/hooks/useRouteLogo.ts` line 6 controls both header and footer (via `Footer.tsx` and the top nav).

```ts
// before
const everyDriverLogo = "/everydriver-logo-full.png?v=20260607";

// after
import everyDriverLogoAsset from "@/assets/everydriver-logo-jun7.png.asset.json";
const everyDriverLogo = everyDriverLogoAsset.url;
```

## Out of scope
- `useDomainBranding.ts`, `OnboardingLayout.tsx`, `InstructorSignup.tsx`, `PortalShell.tsx`, and `index.html` OG/Twitter meta still reference the old `/everydriver-logo-full.png`. Leave those untouched unless you ask — they're instructor portal / social previews, not the public marketing header/footer.

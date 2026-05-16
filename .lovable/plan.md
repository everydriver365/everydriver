# Redesign the Test Swap Register page (web translation of the React Native spec)

The pasted spec is React Native (`View`, `TouchableOpacity`, `Picker`, `KeyboardAvoidingView`). The project is a React + Tailwind web app, so I'll translate the design — tokens, structure, typography, behaviour — into web equivalents. **All existing form state, validation, API calls, supabase logic, edit mode, "done" state, and routing stay exactly as they are today.** Only the JSX inside the `else` branch (the form UI) changes.

## Scope

- File: `src/pages/TestSwapRegister.tsx` — replace the visual layer only (lines 244–438 roughly).
- New presentational components in `src/components/test-swap/register/`:
  - `SwapRegisterHeader.tsx` (navy bar with back link + Drive365 wordmark)
  - `SwapRegisterHero.tsx` (tag, headline, subtitle, 4-step progress)
  - `SwapFormCard.tsx` (white card with 3 sections + dividers)
  - `SwapSection1.tsx`, `SwapSection2.tsx`, `SwapSection3.tsx`
  - `SwapFormFooter.tsx` (consent + submit)
  - `SwapField.tsx` (label / required / optional / hint wrapper)
  - `SectionHeader.tsx` (numbered badge + title + subtitle)
  - `tokens.ts` (the colour map below)
- The container in `TestSwapRegister.tsx` swaps `MainLayout` + container for the new header + scroll layout, but keeps:
  - `useState form`, `setField`, `handleSubmit`, `submitting`, `done`, `loadingExisting`, `isEdit`, `centres` query, `signupId`, `localStorage` write, navigate-on-success.
  - The `done` success card and the `loadingExisting` spinner (unchanged styling — they were not in the spec).
  - The `signupSchema` zod validation.
  - All existing API calls and `supabase` interactions.

No new libraries. Uses existing shadcn `Input`, `Textarea`, `Checkbox`, `Select`, and `lucide-react` icons (`ChevronLeft`, `ChevronRight`, `Check`, `Info`, `ArrowRight`, `Loader2`).

## Design tokens (`tokens.ts`)

Exact values from the spec, used as inline hex (kept literal — they're page-scoped marketing colours, not part of the global design system):

```ts
export const swap = {
  navy: '#0F2044', blue: '#1A52A0', blueMid: '#B5D4F4', blueLight: '#E6F1FB',
  red: '#CC2229', redLight: '#FBEAEA',
  charcoal: '#2B2B2B', mid: '#6B7280', muted: '#9CA3AF',
  surface: '#F2F4F8', surfaceAlt: '#E8EDF6',
  white: '#FFFFFF', border: '#DDE3ED', borderDark: '#C4CEDF',
} as const
```

## Page layout

```text
<div className="min-h-screen" style={{ background: '#F2F4F8' }}>
  <SwapRegisterHeader />                  // sticky-style navy bar
  <main>
    <SwapRegisterHero />                  // tag, headline, subtitle, 4-step progress
    <form>
      <SwapFormCard>
        <SwapSection1 />                  // contact details (navy badge)
        <SwapSection2 />                  // current test (blue badge)
        <SwapSection3 />                  // preferred dates (red badge)
      </SwapFormCard>
      <SwapFormFooter />                  // consent + submit
    </form>
  </main>
</div>
```

Max width: `max-w-2xl` (matches existing). Horizontal padding `16px` mobile / `24px` desktop.

## Component details

### SwapRegisterHeader
- Full-width navy `#0F2044` bar, height `56px`.
- Left: `←` + "Back to test swap" → `/test-swap` (or `/test-swap/matches/:id` in edit mode, preserving current back behaviour).
- Right: "Drive**365**" wordmark with `365` in `#5DCAA5`.
- Replaces the in-page back `<Link>` at line 217 and supersedes `MainLayout`'s header for this screen only — wrap with a plain `<div>` instead of `MainLayout` so the navy band reaches the viewport edges. SEO head stays.

### SwapRegisterHero
- Small uppercase tag "TEST SWAP NETWORK" with a navy bar accent.
- `h1`: "Register for a test swap" (or "Edit your swap details" in edit mode), 26px, `#0F2044`.
- Subtitle in `#6B7280`, light weight.
- 4-step progress: `[1 Your details] — [2 Find a match] — [3 Call DVSA] — [4 Confirmed]`. Step 1 is active (navy fill, white number). Steps 2–4 are inactive (light grey fill, muted number/label). Connecting hairlines `#DDE3ED`.

### SwapFormCard
- White card, `border: 1px solid #DDE3ED`, `border-radius: 16px`, soft shadow `0 2px 16px rgba(15,32,68,0.06)`.
- 3 sections separated by `1px` `#F2F4F8` dividers, each `padding: 24px`.

### SectionHeader (reusable)
- `32×32` rounded badge (`border-radius: 9px`) with the section colour, white bold number.
- Title 15px semibold `#0F2044`; subtitle 12px light `#6B7280`.

### SwapSection1 — contact details
- Title: "Your contact details" / Subtitle: "DVSA will call you on the number below — it must match the number on your DVSA booking"
- Row (md+): `Full name *` | `Mobile number *` (with hint "Must match your DVSA booking")
- Row: `Email address *` (full width). In edit mode keeps the existing read-only behaviour and helper line.

### SwapSection2 — current test (badge `#1A52A0`)
- Title: "Your current test" / Subtitle: "The slot you want to swap away from"
- Tinted checkbox panel: "I already have a test date booked and **want to swap it**"
  - When checked: bg `#E6F1FB`, border `#1A52A0`; otherwise bg `#F2F4F8`, border `#DDE3ED`. Uses shadcn `Checkbox`.
- `Current test centre *` — shadcn `Select` populated from existing `centres` query.
- Row: `Current test date *` (`<input type="date">`) | `Current test time *` (`<input type="time">`). Both wrapped in `SwapField` so labels/format match.

### SwapSection3 — preferred dates (badge `#CC2229`)
- Title: "When would you like instead?" / Subtitle: "The date range you'd be happy to receive"
- Info box: blue tint `#E6F1FB`, circular info icon `#1A52A0`, copy "Your **booking reference, payment and special requirements** all stay the same. Only your test date, time and centre will change." (text colour `#0C3D7A`).
- Date pair: `Earliest date *` → (decorative arrow) → `Latest date *`. Arrow hidden on mobile (stack vertically), shown on `md+`.
- `Anything else?` (optional) — shadcn `Textarea`, 4 rows, placeholder matches spec.

### SwapFormFooter
- Surface `#F2F4F8`, hangs flush under the card with `border: 1px solid #DDE3ED`, `border-top: 0`, rounded bottom corners 16px.
- Consent checkbox: copy from spec, with `privacy policy` link to `/privacy-policy` and "**DVSA on 0300 200 1122**" emphasis. Defaults to unchecked.
- Submit row: left side mini-text "Free to join. We'll notify you when a match is found." Right side red CTA `#CC2229`: "Join the swap pool" + chevron, or "Save changes" in edit mode. Disabled state at `opacity: 0.45` when `canSubmit` is false (computed from required fields + consent) or `submitting`. Spinner replaces label when submitting.

### SwapField helper
- Uppercase 11px semibold label `#6B7280`, red `*` for required, light "· optional" suffix, optional hint line.

## Tailwind vs inline

Use inline `style` for the spec's exact hex values (the navy bar, badges, brand-coloured borders). Use Tailwind for layout primitives (`grid`, `gap-4`, `md:grid-cols-2`, `space-y-6`). This keeps colour tokens visually identical to the spec without polluting the global design system.

## Behaviour mapping (RN → web)

- `KeyboardAvoidingView` → not needed on web; the browser handles input focus + scroll.
- `ScrollView` → the page scrolls naturally; no custom container.
- `TouchableOpacity` → `<button type="button">` or label-wrapped checkbox.
- `Picker` → existing shadcn `Select`.
- Date/time pickers → native `<input type="date" />` / `<input type="time" />` (already used today).
- `StatusBar` → not applicable on web.
- `Poppins` font → already imported in `index.css` is `Inter`. Add a single `@import` for Poppins 300/400/500/600/700 in `index.css`, and a `.swap-register` class scoped to this page that sets `font-family: 'Poppins', 'Inter', sans-serif`. This avoids changing the global font.

## Out of scope (per the spec's hard constraint "do not modify any existing screens / API / state")

- No changes to `TestSwap.tsx`, `TestSwapMatches.tsx`, `TestSwapBrowse.tsx`.
- No changes to `signupSchema`, supabase queries, edit-mode loading, success state, or navigation targets.
- No changes to `MainLayout` (this page just stops using it).
- No new dependencies, no new API endpoints, no global token changes.

## Files added / changed

```
src/pages/TestSwapRegister.tsx                          // edit: replace form JSX, drop MainLayout wrapper
src/components/test-swap/register/tokens.ts             // new
src/components/test-swap/register/SwapRegisterHeader.tsx// new
src/components/test-swap/register/SwapRegisterHero.tsx  // new
src/components/test-swap/register/SwapFormCard.tsx      // new
src/components/test-swap/register/SwapSection1.tsx      // new
src/components/test-swap/register/SwapSection2.tsx      // new
src/components/test-swap/register/SwapSection3.tsx      // new
src/components/test-swap/register/SwapFormFooter.tsx    // new
src/components/test-swap/register/SwapField.tsx         // new
src/components/test-swap/register/SectionHeader.tsx     // new
src/index.css                                           // edit: add Poppins @import + .swap-register font scope only
```

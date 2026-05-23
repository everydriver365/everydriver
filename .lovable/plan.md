## Rearrange Account page header (instructor mobile)

Merge the "Settings" back chevron into the same row as the Account icon/title to reduce the cramped feel at the top. Avatar card stays as-is.

### Change

In `src/components/instructor/settings/SettingsLayout.tsx` (mobile branch, `isAccount` case ~lines 145–174):

- Remove the standalone back button (`<button> ChevronLeft Settings </button>`) above the header.
- Render a new combined row in its place:
  - Left: small back chevron button (just the `<` icon, ~28px tap target, muted grey) wired to `navigate("/instructor/settings")`.
  - Right: the existing `<AccountMobileHeader />` (36px blue icon + "Account" title + subtitle), unchanged.
  - Layout: flex row, `gap: 10px`, vertically centered.
- Add a touch more top breathing space above this row (e.g. `paddingTop: 4px`) and keep the existing spacing before the first card so the avatar card position doesn't shift noticeably.

### Out of scope

- No change to the `AccountMobileHeader` content (icon, title, subtitle copy all stay).
- No change to the avatar / profile basics card or any card below.
- No change to non-Account categories — they keep the current stacked back link + header.
- No data binding, routing, or save logic changes.

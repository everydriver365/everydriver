# Remove app-wide dictation mic + fix collapsed input layouts

## Root cause
`src/components/ui/input.tsx` was customised to:
1. Default `enableDictation = true` → every text input renders a mic button inside it.
2. Wrap the native `<input>` in `<div className="relative flex items-center w-full">` so the mic icon can be absolutely positioned. But `className` (with grid utilities like `col-span-6`) is forwarded to the inner `<input>`, not the wrapper div — so in grid layouts (e.g. invoice line items) all inputs collapse into the first grid track and render as ~40px squares.

Result on `/instructor/invoices` New invoice → Line items: three tiny boxes stacked at left under the NAME column, each with a mic icon.

## Fix
Replace `src/components/ui/input.tsx` with the standard shadcn Input primitive:

- No wrapper div, no dictation button, no `enableDictation`/`dictationLang` props.
- `className` applies directly to `<input>` — grid utilities work again.
- Keeps the same `forwardRef`, displayName, default styling, and exported `InputProps` (with the two extra props removed) so existing imports continue to compile.

Delete the now-unused dictation helper to avoid drift: `src/components/ui/dictation-button.tsx` (verified used only by the Input wrapper).

## Out of scope
- No changes to individual dialogs/forms — fixing the Input primitive transparently restores correct layout everywhere and removes the mic across the app.
- No mobile-layout changes.
- Speech-to-text inside `AddLessonSheet` / `VoiceQuickAddLessonSheet` (those use their own voice flows, not the Input's DictationButton) remains untouched.

## Technical notes
- I'll first grep for any direct usage of `enableDictation` / `dictationLang` props or imports of `dictation-button` outside the Input file. If any non-Input consumer exists, I'll keep `dictation-button.tsx` and only strip the dictation wrapper out of `Input`. Otherwise the file is deleted.

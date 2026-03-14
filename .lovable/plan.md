

## Fix Console Errors

There are two categories of errors showing up:

### 1. React forwardRef Warnings (Fixable Now)
`TypewriterText` and `BriefingActionCards` are function components that React is trying to pass refs to (via framer-motion's animation system). They need to be wrapped with `React.forwardRef` to accept refs properly.

**Files to change:**

- **`src/components/instructor/MorningBriefingCard.tsx`** — Wrap the `TypewriterText` component with `React.forwardRef`.
- **`src/components/instructor/BriefingActionCards.tsx`** — Wrap the exported `BriefingActionCards` component with `React.forwardRef`.

Both are straightforward one-line changes to the component signature.

### 2. Radius Poller 401/403 (Deferred)
As discussed previously, the Velocity Fleet API is rejecting requests due to a permissions issue on their side. This was deferred — no code changes will be made for this.


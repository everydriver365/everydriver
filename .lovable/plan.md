

## Problem

The `Theory` page component (`src/pages/Theory.tsx`) wraps all its content in `<MainLayout>`, which is the main Drive365 site layout (header, footer, nav). When `MiniWebsiteTheory` renders `<Theory />` inside `<MiniWebsiteLayout>`, you get a nested layout — the mini-website shell containing the full Drive365 shell inside it.

## Solution

Extract the theory content into a standalone component (`TheoryContent`) that has no layout wrapper, then use it in both places:

### Files to modify

**1. `src/pages/Theory.tsx`** — Extract all the theory logic and UI into a new `TheoryContent` component exported separately. Keep the default export wrapping `TheoryContent` in `MainLayout` so the main site still works.

**2. `src/pages/mini-website/MiniWebsiteTheory.tsx`** — Import `TheoryContent` instead of `Theory`, so it renders inside `MiniWebsiteLayout` without the nested Drive365 layout.

### Structure

```text
Theory.tsx
├── export function TheoryContent()   ← pure content, no layout
└── export default function Theory()  ← MainLayout + TheoryContent (for main site)

MiniWebsiteTheory.tsx
└── MiniWebsiteLayout + TheoryContent  ← mini-site layout + pure content
```

This is a small, clean change — just moving the JSX out of `MainLayout` into a named export, then importing the right one.


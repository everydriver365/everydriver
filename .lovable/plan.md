## Issue

The mobile home page background is currently `#F7F7F7` (the global `--dsm-bg` token), not the spec's `#F2F2F4`. The previous typography pass didn't change page chrome.

The page background can't simply override the global `--dsm-bg` token — that token is shared across the entire instructor portal (sidebar, settings pages, sheets, etc.) and changing it would shift colours app-wide. Instead, set `#F2F2F4` directly on the mobile home root.

## Change

**File:** `src/components/instructor/InstructorMobileHome.tsx` (line ~370)

Replace the root wrapper's `background: "transparent"` with `background: "#F2F2F4"` so the home page paints the system grey called for in the spec, while leaving the rest of the instructor portal on `--dsm-bg` untouched.

```diff
 <div
   className="min-h-screen flex flex-col overflow-x-hidden relative"
   style={{
-    background: "transparent",
+    background: "#F2F2F4",
   }}
 >
```

That's the only change — single line, no token edits, no impact on other pages.

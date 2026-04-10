

# Comprehensive Rounded Corners Removal — All Instructor Components

## Problem
The previous fix only addressed 19 files. There are still **4,132 instances** of `rounded-xl`, `rounded-2xl`, `rounded-lg`, `rounded-md`, `rounded-sm`, and `rounded-[Npx]` across **288 files** in `src/components/instructor/`.

The screenshot confirms tiles like the Today carousel card, Daily Briefing card, Telematics tile, and many others still display rounded corners.

## Solution
Run a single bulk `sed` command across **all** files in `src/components/instructor/` to replace every rounding class (except `rounded-none` and `rounded-full`) with `rounded-none`.

## Technical Details

**One command covering all 288 files:**
```bash
find src/components/instructor -name '*.tsx' -exec sed -i -E \
  's/rounded-(3xl|2xl|xl|lg|md|sm)\b/rounded-none/g; s/rounded-t-(3xl|2xl|xl|lg|md|sm)\b/rounded-none/g; s/rounded-b-(3xl|2xl|xl|lg|md|sm)\b/rounded-none/g; s/rounded-l-(3xl|2xl|xl|lg|md|sm)\b/rounded-none/g; s/rounded-r-(3xl|2xl|xl|lg|md|sm)\b/rounded-none/g; s/rounded-\[[0-9]+px\]/rounded-none/g; s/rounded-t-\[[0-9]+px\]/rounded-none/g; s/rounded-b-\[[0-9]+px\]/rounded-none/g' {} +
```

**Preserved:** `rounded-full` (circular avatars, badges, dots, status indicators) and existing `rounded-none`.

**Scope:** All `.tsx` files under `src/components/instructor/` — covers every tile, card, modal, sheet, dashboard widget, and overlay in the instructor mobile app.


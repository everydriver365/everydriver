

## Plan: Replace Lucide icons with native emojis across the instructor app

### Approach

Build a single `<Emoji>` component plus a curated **Lucide → emoji map**, then swap Lucide imports inside instructor-scoped files to use it. Where no sensible emoji exists (chevrons, dots, generic UI glyphs), the component falls back to the original Lucide icon so we don't end up with random squares or weird substitutions.

### 1. New component: `src/components/instructor/Emoji.tsx`

A tiny presentational component that:
- Renders a `<span role="img" aria-label="...">` with the emoji glyph
- Accepts `size` (matches Lucide's `h-4 w-4`, `h-5 w-5` etc. via `fontSize`)
- Uses the system emoji stack: `"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`
- Disables colour inheritance (emojis are already coloured) — strips `text-*` colour classes from `className`

### 2. Mapping layer: `src/components/instructor/iconEmojiMap.ts`

A curated map covering the ~80 Lucide icons actually used in instructor screens. Examples:

```text
Briefcase   → 💼     MessageSquare → 💬     CheckCircle → ✅
Clock       → ⏰     Calendar      → 📅     Car         → 🚗
PoundSterling → 💷   MapPin        → 📍     Bell        → 🔔
Users       → 👥     GraduationCap → 🎓     Heart       → ❤️
Camera      → 📷     Sparkles      → ✨     AlertTriangle → ⚠️
Phone       → 📞     Mail          → 📧     Star        → ⭐
Home        → 🏠     Search        → 🔍     Settings    → ⚙️
Plus        → ➕     Trash         → 🗑️     Edit        → ✏️
Sun ☀️ / Moon 🌙 / CreditCard 💳 / Gift 🎁 / Target 🎯 / Zap ⚡ ...
```

Icons with **no good emoji** (kept as Lucide): `ChevronRight/Left/Up/Down`, `MoreHorizontal`, `MoreVertical`, `X`, `Menu`, `ArrowRight`, `ArrowLeft`, `Loader2`, `EllipsisVertical`, `GripVertical`, plus any icon not in the map.

### 3. Codemod: swap Lucide usage inside the instructor portal

A one-shot Node script that, for every file under:
- `src/components/instructor/**`
- `src/components/layout/Instructor*.tsx`, `MobileBlueHeader`, `InstructorBottomNav`, etc.
- `src/pages/Instructor*.tsx` and `src/pages/instructor/**`

…rewrites `<IconName className="..." />` JSX usages to `<Emoji name="IconName" className="..." />`. The `<Emoji>` component looks the name up in the map and renders either the emoji or the original Lucide icon. Lucide imports stay in place (still used as fallback inside `<Emoji>`), so nothing breaks if a name isn't in the map yet.

### 4. Excluded from the swap

Per existing memory rules and to avoid regressions:
- Public/learner site (`Drive365`, mini-websites, marketing pages) — untouched
- Admin / school portals — untouched
- Charts, map markers, and any icon used as an SVG `fill`/`stroke` target (e.g. inside `<svg>` or chart libraries)
- Pure decorative icons inside Lucide-only primitives like `ChevronRight` in dropdowns

### 5. QA pass

Walk the instructor mobile home screen at 390px and verify:
- Activity tiles show 💼 💬 ✅ ⏰ etc. at the right size
- Status card, week glance, telematics, next lesson — all icons swapped
- Header, bottom nav, FAB — swapped where a sensible emoji exists, Lucide otherwise (so layout stays clean)
- Dark mode unaffected (emojis ignore `text-*` colours by design)

### Files created
- `src/components/instructor/Emoji.tsx`
- `src/components/instructor/iconEmojiMap.ts`

### Files modified
- All instructor-scoped components and pages (~250 files) — mechanical JSX rewrite via codemod, no logic changes

### Notes / trade-offs
- **Visual consistency** drops slightly — emoji rendering varies across iOS/Android/Windows. This is inherent to "native system emojis".
- **Colour theming** for icons (e.g. red briefcase, blue message) is lost since emojis carry their own colour. The notification badges, backgrounds, and tile categories stay as-is.
- If the result looks too playful in some surfaces (e.g. settings, finance pages), we can shrink the map to only the home/dashboard surfaces in a follow-up.


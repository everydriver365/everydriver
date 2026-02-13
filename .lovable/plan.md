

## Match the Instructor Marketing Page Header to the Main Website Style

### What this changes

The homepage (`/`) currently uses `InstructorSaaSLayout` which has a **white background header** with the EveryDriver logo and **emerald-green** accented navigation. The main Drive365 website uses a **navy blue (`bg-primary`) header** with centered navigation, a postcode search bar, and the Drive365 logo.

This plan updates the `InstructorSaaSLayout` header to match the main site's `Header` component style while keeping the instructor-specific navigation links and CTAs.

### Changes

| Element | Current (InstructorSaaSLayout) | Updated (matching main site) |
|---------|-------------------------------|------------------------------|
| Header background | White (`bg-background`) | Navy blue (`bg-primary`) |
| Logo | `/everydriver-logo-full.png` | `/everydriver-logo-full.png` (kept, but could swap to Drive365 if preferred) |
| Nav link color | Dark text with emerald hover | Light text (`text-nav-foreground/80`) with accent hover |
| Active link color | Emerald green | Accent color |
| Nav layout | Right-aligned | Centered (absolute positioned) |
| CTA buttons | Emerald "Get Started Free" | Brand blue styling |
| Mobile menu trigger | Dark icon | Light/white icon |
| Extras | None | Theme toggle and language toggle in header bar (already present but styled differently) |

### File changed

**`src/components/layout/InstructorSaaSLayout.tsx`** -- Update the header section to use the navy `bg-primary` background, white/light nav text, centered desktop navigation, and brand-blue CTA buttons matching the style in `src/components/layout/Header.tsx`.

### Technical details

- Replace `bg-background` with `bg-primary` on the header
- Change nav link classes from `text-foreground/70 hover:text-emerald-500` to `text-nav-foreground/80 hover:text-accent`
- Change active link class from `text-emerald-500` to `text-accent`
- Center the desktop nav using `absolute left-1/2 -translate-x-1/2`
- Update "Get Started Free" button from emerald to brand blue (`bg-[#0075c9] hover:bg-[#005a9e]`)
- Update "Log in" button to use light text styling
- Update mobile menu button to use `text-nav-foreground`
- Mobile menu dropdown remains `bg-background` for readability


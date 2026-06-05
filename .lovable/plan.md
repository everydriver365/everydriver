## Redesign the video section — "Modern editorial" direction

Replace the existing desktop video section JSX (currently in the `afterHero` prop of `<Drive365Home>` in `src/pages/Index.tsx`) with the selected Modern Editorial layout.

### Visual spec (locked from selected prototype)
- Outer card: white background `#FFFFFF`, `border-radius: 2.5rem` (40px), soft shadow `0 32px 64px -16px rgba(0,0,0,0.06)`, max-width 1200, centered, on the existing `#F6F6F8` page background.
- 50/50 split: video left, content right.
- **Left (media)**: existing `videoThumbnailImg` filling the half, hover scale-105 over 700ms, subtle `bg-black/5` overlay that clears on hover. "2 MIN WATCH" pill top-left — white/90 frosted, uppercase, tracking-widest, dark text. Centered play button: 80px frosted glass ring (`bg-white/20 backdrop-blur border-white/40`) containing a 56px solid white disc with an orange `#EA580C` play triangle.
- **Right (content)**: padding ~64px. Eyebrow "OUR STORY" in `#1A6FD4`, uppercase, tracking 0.2em. Headline in **Instrument Serif** (load from Google Fonts), 48px, line-height 1.1, color `#0F172A`; the word "confidence" italic in `#EA580C`. Paragraph 16px slate-600. Social proof row: 3 small avatars (-space-x-2, white border), star + "4.9" in orange, "From 6,499 reviews" caption. CTAs: rounded-full pill button `#EA580C` → "Play Video" with chevron; secondary text link "Find an Instructor" in `#1A6FD4` with bottom-border-on-hover.
- No dark surfaces anywhere.

### Implementation notes
- Add `Instrument Serif` to `index.html` `<head>` Google Fonts (alongside existing fonts).
- Keep all existing handlers: `welcomeVideoUrl`, `setVideoModalOpen`, the `Link to="/courses"`, and the existing avatar imports (`testimonialSarahFallback`, `testimonialJamesFallback`, `testimonialEmmaFallback`) — use those for the avatar row rather than placeholders.
- Keep `className="hidden md:block"` — mobile video section stays untouched (mobile policy).
- Keep the section wrapper so it remains inside `afterHero`, sitting directly under the hero as today.
- No backend/data changes.

### Files
- `src/pages/Index.tsx` — replace the `afterHero` JSX (the existing white video card) with the new layout.
- `index.html` — add `Instrument Serif` font link.

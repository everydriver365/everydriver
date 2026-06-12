Update the desktop homepage hero search block in `src/components/home/Drive365Home.tsx` and the shared `src/components/home/PostcodeSearch.tsx` to match the provided brand spec.

### Scope
Only the desktop hero/welcome section and its search row. Mobile homepage (`MobileHomepage`) and all downstream sections remain untouched.

### Changes

1. **Hero container (`Drive365Home.tsx`)**
   - Change `.d365-welcome` background from `#EAF0FF` to `#E8EEFB`.
   - Add border `1.5px solid #d6e0f5` and `border-radius: 20px`.
   - Update padding to `2.75rem 2rem` (approx 44px 32px).
   - Set `max-width: 760px` and centre the container.
   - Ensure `font-family: 'Poppins', sans-serif` is applied.

2. **Eyebrow label**
   - Keep text "Find your instructor".
   - Style: `12px`, bold, uppercase, `letter-spacing: 0.14em`, colour `#D12E2E`.

3. **Headline**
   - Keep text "See who's teaching you before you book."
   - Style: `38px`, `font-weight: 800`, colour `#0F2044`, `line-height: 1.2`.
   - Responsive: scale down to `~28px` under `520px` viewport width.

4. **Subtext**
   - Keep text "Every instructor verified. Real reviews. Real pass rates. You choose who teaches you. All bookings backed by us."
   - Style: `15px`, grey `#666`, `line-height: 1.7`, `max-width: 520px`, centred.
   - Make the phrase "All bookings backed by us." bold and navy `#0F2044`.

5. **Search row (`PostcodeSearch.tsx`)**
   - Flex row with `gap: 10px`, `max-width: 560px`.
   - Stacks vertically under `520px`.
   - **Input:** white `#fff` background, border `1.5px solid #d6e0f5`, `border-radius: 10px`, padding `14px 16px`, `14px Poppins`, placeholder "Find driving instructors near you", focus border turns blue `#0070C0`.
   - **Button:** background `#D12E2E`, white text, `border-radius: 10px`, padding `14px 28px`, `14px bold uppercase "SEARCH"` with `Search` icon, `letter-spacing: 0.04em`, hover `#b52626`.
   - Remove the current sharp-cornered input/button split styling.

6. **Pay-later row**
   - Text "Book now, pay later with" — `12px`, `#888`.
   - Two pill badges inline:
     - "Klarna" — background `#FFB3C7`, navy text `#17120F`, `11px` bold, `border-radius: 6px`, padding `4px 10px`.
     - "Clearpay" — background `#B2FCE4`, navy text `#000E18`, `11px` bold, `border-radius: 6px`, padding `4px 10px`.
   - Use Poppins font for the pills.

### Technical notes
- `PostcodeSearch.tsx` is only consumed by `Drive365Home.tsx`, so global changes there are safe.
- Keep the existing postcode validation and `useTypewriter` hook behaviour.
- Keep the existing `navigate(`/courses?postcode=${encodeURIComponent(v)}`)` logic.
- Do not modify mobile layout rules in `Drive365Home.tsx` or `MobileHomepage`.
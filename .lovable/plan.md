

## Replace Hero CTAs with Postcode Search

Replace the two CTA buttons (lines 159-171) and the trust row (lines 173-184) with a postcode search box using the existing `PostcodeAutocomplete` component, plus a "Find Courses" button that navigates to `/courses?postcode=...`.

### Changes in `src/pages/Index.tsx`
- **Remove** lines 159-184 (the CTA buttons and trust row)
- **Replace with**: A postcode search form using `PostcodeAutocomplete` with a "Find Courses" submit button, styled to fit the hero. On select/submit, navigate to `/courses?postcode=<value>`.
- Add local state for the postcode value and a handler using `useNavigate`.
- Keep the trust row beneath the search box for credibility.


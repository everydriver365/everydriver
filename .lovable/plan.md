The hero image is not visibly rounded because a global Drive365 rule in `src/index.css` is overriding almost every border radius inside `.learner-app`:

```css
.learner-app *:not(.rounded-full):not([class*="avatar"]):not([class*="badge"]):not([class*="Avatar"]) {
  border-radius: 0 !important;
}
```

That `!important` beats the `rounded-3xl` classes already added to the hero image container and image, so the corners are forced back to square.

Plan:
1. Add a specific opt-out class for the Drive365 hero image container, similar to the existing `etg-rounded-tile` exception.
2. Apply that class only to the hero image clipping container/image in `HeroSearchSection.tsx`.
3. Keep the outer hero wrapper unchanged so the search box can still overflow below the image.
4. Verify the hero container keeps rounded corners while the rest of the learner app remains unaffected.
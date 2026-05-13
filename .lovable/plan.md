The hero image itself now has radius classes, but the page-level learner CSS is still neutralising/clashing with radius and the rendered section lacks a reliable clipping boundary at the visible image edge.

Plan:
1. Update the Drive365 desktop hero image wrapper in `HeroSearchSection` so the visible image is clipped by a dedicated rounded container with explicit inline `borderRadius` and `overflow: hidden`, not just Tailwind classes.
2. Update the learner-app CSS opt-out so `.drive365-hero-rounded` and all direct overlay/image children preserve the same radius and clipping, while leaving the intentional square learner tiles/cards unchanged.
3. Verify `/drive365` at the current desktop viewport and confirm the top hero image corners render rounded.
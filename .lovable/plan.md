

## Plan: Remove Top Radius from Hero

The hero container currently has `rounded-b-[20px]` which should only round the bottom. However, the issue may be that the hero sits inside a parent container that adds its own border radius, or the browser is rendering residual radius.

### Change (single file: `src/components/instructor/HomepageHero.tsx`)

- Replace `rounded-b-[20px]` with explicit style overrides to force zero top radius:
  - Add inline style: `borderRadius: '0 0 20px 20px'` to guarantee no top rounding
  - Remove the Tailwind `rounded-b-[20px]` class to avoid conflicts




## Fix: Remove top border radius from hero banner

The Tailwind classes `rounded-b-[20px] rounded-t-none` may not override correctly due to CSS specificity with arbitrary values. The fix is to use an inline `borderRadius` style instead.

### Change in `src/components/instructor/HomepageHero.tsx` (line 41-42)

Replace:
```tsx
className="relative h-[160px] overflow-hidden rounded-b-[20px] rounded-t-none"
style={{ paddingTop: "env(safe-area-inset-top)" }}
```

With:
```tsx
className="relative h-[160px] overflow-hidden"
style={{ paddingTop: "env(safe-area-inset-top)", borderRadius: "0 0 20px 20px" }}
```

This uses an explicit inline `borderRadius` with `0 0 20px 20px` (top-left, top-right, bottom-right, bottom-left) to guarantee zero radius on top and 20px on bottom, bypassing any Tailwind specificity issues.


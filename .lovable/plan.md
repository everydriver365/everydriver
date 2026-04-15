

# Make Job Offers Tile Conditional on Count

## Change
In `src/components/instructor/HomepageHero.tsx`, make the `highlight` property conditional on `pendingJobs > 0`. When there are no job offers, the tile will render in the same neutral grey style as the other stat tiles.

### `src/components/instructor/HomepageHero.tsx` (~line 158)
Change:
```ts
highlight: true,
```
To:
```ts
highlight: pendingJobs > 0,
```

That's the only change needed — the render logic already switches between blue and neutral based on `stat.highlight`.

Also fix the runtime error: `MiniCarIllustration is not defined` — a leftover reference that needs removing if still present.


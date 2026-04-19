
The PWA safe area is still showing white because:

1. **`index.html` still has `theme-color` = `#FFFFFF`** — the previous edit didn't actually save (only `bun.lock` was edited last turn). The `<meta name="theme-color" content="#FFFFFF" />` is still in `index.html`.

2. **`DynamicPWAMeta.tsx` overrides it at runtime** — even if I fix `index.html`, this component runs on every route change and forces `themeColor: "#FFFFFF"` for the `instructor` portal config. So the meta tag gets reset to white on the instructor routes (which is exactly where this dark header lives).

Both must change together, otherwise `DynamicPWAMeta` will undo the static fix.

## Plan

**1. `index.html`** — change static fallback:
```html
<meta name="theme-color" content="#050818" />
```

**2. `src/components/pwa/DynamicPWAMeta.tsx`** — update the `instructor` portal config so the runtime `theme-color` matches the dark header gradient start:
```ts
instructor: {
  ...,
  themeColor: "#050818",  // was "#FFFFFF"
},
```

Leave `learner`, `pupil`, `parent`, and `default` configs untouched — they have their own (correct) brand colors.

**Important note:** The status-bar color from `theme-color` only takes visible effect in:
- Installed PWA (Add to Home Screen) standalone mode on iOS/Android
- Chrome on Android address bar

It does **not** apply inside the Lovable preview iframe or in regular desktop browser tabs. To verify, the user needs to reinstall the PWA from the home screen (delete and re-add) after publishing, since iOS caches the manifest/theme aggressively.

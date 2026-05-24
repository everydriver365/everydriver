## Why TestFlight's login screen differs from the preview

`capacitor.config.ts` has:

```ts
server: {
  url: 'https://ca10d01e-cc99-4c0b-9186-351c493398b9.lovableproject.com?forceHideBadge=true',
  cleartext: true,
}
```

That `server.url` is the Lovable **sandbox** (dev) hot-reload URL. It is meant only for local development against the in-editor sandbox. Because it's committed to the config, every TestFlight build also points the iOS WebView at that sandbox instead of loading the bundled `dist/` assets. As a result, TestFlight is rendering whatever the sandbox serves at that moment — a different build than the published `everydriver.lovable.app` you see in the preview, and almost certainly hitting Cloud **Dev** (not Production) auth, with different OAuth redirect URIs and different session state.

That's why the login screen looks/behaves differently in TestFlight vs the preview.

## Fix

Remove the `server` block from `capacitor.config.ts` for production builds so the native app loads the bundled web assets from `dist/` (which is what gets shipped to TestFlight and the App Store).

### Change

`capacitor.config.ts` — delete the `server` block:

```ts
const config: CapacitorConfig = {
  appId: 'app.lovable.ca10d01ecc994c0b9186351c493398b9',
  appName: 'everydriver',
  webDir: 'dist',
  // server: { url: '...', cleartext: true }  ← REMOVED
  ios: { ... },
  android: { ... },
  plugins: { ... },
};
```

No other code changes. No auth code changes. No route changes.

### What the user has to do after the change

Because the native iOS project is generated locally (not in Lovable), you must:

1. `git pull` the change
2. `npm install && npm run build`
3. `npx cap sync ios`
4. Open `ios/App/App.xcworkspace` in Xcode
5. Archive → upload a new TestFlight build

The new TestFlight build will load the same code that's bundled at build time, matching whatever was on `main` when you built — same login screen behaviour as the published web app.

### If you still want hot-reload during local dev

Keep the `server.url` only in a local, gitignored override (or comment it back in temporarily while developing), and always remove/comment it before building for TestFlight. The cleanest pattern is to gate it on an env var, but for now removing it outright is the correct fix for the reported symptom.

### Out of scope

- No changes to `MobilePortalLoginShell`, `GoogleSignInButton`, biometric auth, or any auth flow code — those are working correctly; they're just being rendered from the wrong source in TestFlight.
- No changes to OAuth redirect URIs or Cloud auth config.
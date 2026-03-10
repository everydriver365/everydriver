

## Redirect `/instructor-app` to `/` and clean up

### Changes

1. **`src/App.tsx`**: Replace the `/instructor-app` route element with a `<Navigate to="/" replace />` redirect. All `/instructor-app/*` sub-routes (features, pricing, login, etc.) remain untouched.

2. **Remove lazy import** of `HomepageRedesignDemo` that was added for the `/instructor-app` route (if it's only used there — will verify).


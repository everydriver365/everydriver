

## Make `/instructor-app` use the same page as the homepage

The `/instructor-app` route currently renders `InstructorAppHome` (a CMS-driven 485-line page). The user wants it to show the same design as the cloned `HomepageRedesignDemo` page.

### Changes

1. **`src/App.tsx` (line 211)**: Change the route to render `HomepageRedesignDemo` instead of `InstructorAppHome`:
   ```tsx
   <Route path="/instructor-app" element={<HomepageRedesignDemo />} />
   ```
   Add `HomepageRedesignDemo` to the lazy imports (or direct import) at the top of the file.

That's it — one route change. The `InstructorAppHome` component stays in the codebase in case it's needed later.


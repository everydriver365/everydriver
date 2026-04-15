

## Replace Fleet Map Button with Live/Fleet Segmented Toggle

Swap the separate "Fleet Map" button link on the tracking page for an iOS-style segmented control at the top that toggles between the current Live view and an embedded Fleet Map view.

### Changes — Single file: `src/pages/InstructorLiveSession.tsx`

1. **Add state**: `const [viewMode, setViewMode] = useState<"live" | "fleet">("live");`

2. **Add segmented control** at the top of the non-session layout (after the `<div className="p-4 pb-24 space-y-4">` opening, before the DeviceSelectorDropdown):
   - Use the existing `IOSSegmentedControl` component with segments `[{ value: "live", label: "Live" }, { value: "fleet", label: "Fleet" }]`

3. **Conditionally render content**:
   - When `viewMode === "live"`: show all existing content (device selector, GPS hero, links, mini map, session panel, route recorder, recent sessions)
   - When `viewMode === "fleet"`: render the `InstructorFleetMap` component inline (lazy-imported) instead of the live tracking content

4. **Remove the standalone "Fleet Map" button** (lines ~950-960) since it's now accessible via the toggle

5. **Import** `IOSSegmentedControl` and lazy-load `InstructorFleetMap`

### Technical detail

```tsx
import { IOSSegmentedControl } from "@/components/ui/IOSSegmentedControl";
const InstructorFleetMap = lazy(() => import("@/pages/InstructorFleetMap"));

// In the non-session return:
<IOSSegmentedControl
  segments={[
    { value: "live", label: "Live" },
    { value: "fleet", label: "Fleet" },
  ]}
  value={viewMode}
  onChange={(v) => setViewMode(v as "live" | "fleet")}
  className="mb-2"
/>

{viewMode === "live" ? (
  // ...existing live tracking content
) : (
  <Suspense fallback={<div className="h-[70vh] flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
    <div className="rounded-2xl overflow-hidden border" style={{ height: "70vh" }}>
      <InstructorFleetMap />
    </div>
  </Suspense>
)}
```

The `InstructorFleetMap` component is already self-contained (fetches its own data, renders its own map), so embedding it inline requires no props. The fleet map page's own back-button header will need to be hidden when rendered inline — handled by passing an `embedded` prop or checking if it's rendered inside the tracking page.


I checked the current data and code path. Kenneth/Ken D does have an active Radius tracker linked:

- Device: Charlotte
- Provider: radius
- Active: true
- Recent heartbeat/location present
- Kenneth’s saved tracking preference is still phone

So the tracker exists, but the tracking page is still treating Phone GPS as the selected source. The collapsed tracker row therefore shows Phone tracking, and the mini map does not use Charlotte unless Radius becomes the active provider.

Plan to fix:

1. Make fresh hardware win over stale phone preference
   - In `InstructorLiveSession.tsx`, when an active/fresh Radius device exists and phone tracking is not actively streaming, automatically select Radius as the active provider.
   - This will make Charlotte appear immediately for Kenneth instead of hiding behind the Phone GPS preference.

2. Share discovered device state with the dropdown
   - Track `hasRadiusDevice` and the selected Radius device in the page state after the main device fetch.
   - Pass that state into `TrackingProviderDropdown` so the dropdown does not rely on a second separate query that can lag or fail independently.
   - The collapsed tracker selector should show something like `Radius tracker · Charlotte` when the hardware is available.

3. Keep manual choice behaviour clear
   - If the instructor manually chooses Phone GPS, keep Phone selected for that session.
   - Still show Radius as available in the dropdown, so switching back is one tap.
   - If Radius is connected and selected, the mini map should use the Radius latitude/longitude feed.

4. Improve the empty/offline message
   - Distinguish between:
     - no tracker linked
     - tracker linked but offline/stale
     - tracker linked and connected but not selected
   - This prevents the misleading “no tracker available” state when a device record exists.

5. Verify against Kenneth’s case
   - Confirm the backend still shows Charlotte as active.
   - Verify the tracking page now presents `Radius tracker · Charlotte` and the mini map uses Charlotte’s latest location when Radius is active.

Technical details:

- The existing bug is this branch:

```ts
if (preferred === "phone") {
  setActiveProvider("phone");
}
```

It honours the saved phone preference even when a live Radius device has been discovered. The device is hydrated, but the selected source remains Phone, so the UI/map do not visibly show Charlotte.

- I will change provider resolution to consider live hardware freshness, not just the saved preference.
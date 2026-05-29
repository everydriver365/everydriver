Add the uploaded clay-style "two people waiting" image as a new 3D icon for the Waiting Room tile.

## Steps

1. Copy `user-uploads://image-272.png` → `src/assets/icons-3d/waiting-room.png`.
2. Register it in `src/components/Icon3D.tsx`:
   - Add `import waitingRoom from "@/assets/icons-3d/waiting-room.png";`
   - Add `"waiting-room": waitingRoom,` to `ICON_3D_REGISTRY`.
3. In `src/components/instructor/MobileHomeDSM2026.tsx`, change the Waiting room tile's `icon` from the Lucide `Users` to the string `"waiting-room"` so `Icon3D` resolves directly to the new PNG (other Users-based tiles like Pupils/Nearby ADIs/Find colleague stay on the generic users icon).

No other files affected.

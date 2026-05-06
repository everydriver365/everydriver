# Move pupil name under the speed reading on Live Track

In `src/components/instructor/tracking/FloatingSessionTimer.tsx`:

- Add the pupil name (the existing `headlineName`) directly under the big mph number in the left "speed cluster" column, above the road name. Same truncation/ellipsis treatment as the road name.
- Remove the pupil name from the right-hand session block so it isn't duplicated. That column then shows only the timer · distance · alerts row, vertically centred.

No prop changes, no behaviour changes elsewhere. Test-route fallback ("Test route" / "Lesson") still applies via the existing `headlineName` logic.
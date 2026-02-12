

## Add Real Dashcam Footage to the Video Window

Replace the placeholder Camera icon in the hero section of the Dashcam marketing page with an embedded dashcam video showing real driving instructor footage.

---

### What Changes

**File:** `src/pages/instructor-app/InstructorDashcam.tsx`

The hero section currently shows a dark gradient box with a large Camera icon as a placeholder (lines 176-178). This will be replaced with a real dashcam video using an HTML `<video>` element or a YouTube embed.

---

### Approach

Since there's no dashcam footage file currently in the project, the best approach is to embed a publicly available dashcam demonstration video using a YouTube/Vimeo iframe. This avoids storing large video files in the codebase and loads quickly.

The video window will:
- Use a royalty-free dashcam clip embedded via YouTube (a typical driving lesson POV clip)
- Keep the existing rounded styling, border, and aspect-video ratio
- Add playback controls (muted autoplay with loop for a polished demo feel)
- Retain the "HD 1080p" badge and "Recording" indicator overlay on top of the real footage

If you'd prefer to use your own footage instead, you can upload an MP4 to file storage and we'll swap the URL.

---

### Technical Details

- Replace the `<Camera>` icon placeholder div with an `<iframe>` pointing to a YouTube dashcam clip, or a `<video>` tag with a hosted MP4
- Use `allow="autoplay; encrypted-media"` and `muted autoPlay loop playsInline` attributes for a seamless looping demo
- Keep the overlay badges ("HD 1080p" and "Recording") positioned absolutely on top of the video

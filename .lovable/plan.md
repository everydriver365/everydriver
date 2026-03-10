

## Plan: Separate Drive365 Homepage from Instructor Layout

### Problem
`Drive365HomepageRedesign.tsx` currently wraps content in `InstructorSaaSLayout`, which renders the **instructor** header (EveryDriver logo, instructor nav links, "Get Started Free" CTA) and `InstructorMarketingBottomNav`. This is wrong for the learner site.

The project already has a fully separate `MainLayout` that uses:
- **`Header`** → Drive365 logo, learner nav links (Home, Courses, About, FAQs, Help, Contact)
- **`MobileBottomNav`** → Learner bottom nav (Home, Search, Theory, FAQs, Help, Benefits)
- **`Footer`** → Shared footer

### Change

**`src/pages/Drive365HomepageRedesign.tsx`**
- Replace `import { InstructorSaaSLayout }` with `import { MainLayout }`
- Replace `<InstructorSaaSLayout>` / `</InstructorSaaSLayout>` wrapper with `<MainLayout>`
- Update internal CTAs from instructor paths (`/instructor-app/signup`, `/instructor-app/login`) to learner paths (`/courses`, `/pupil/login`)

This single change ensures the Drive365 homepage uses the correct learner logo, navigation, and bottom nav — completely independent from the instructor marketing pages.


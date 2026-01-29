
# Domain Swap: Drive365 for Learners, EveryDriver for Instructors

## Overview

This plan swaps the domain assignments so that:
- **drive365.co.uk** becomes the learner-facing site (find instructors, book lessons, theory practice)
- **everydriver.co.uk** becomes the exclusive instructor platform (diary, payments, pupils, etc.) and will be wrapped as an iOS app using Capacitor

---

## What Will Change

### For Learners (drive365.co.uk)
- Homepage shows the full learner experience (postcode search, course listings, testimonials)
- All booking flows, theory practice, and pupil portal accessible
- Branding uses "Drive365" logo and styling

### For Instructors (everydriver.co.uk)
- Homepage shows the instructor marketing page (features, pricing, signup)
- All instructor portal routes (/instructor/*) hosted here
- Branding uses "EveryDriver" logo
- Optimized for iOS app wrapper via Capacitor

---

## Technical Details

### Domain Router Updates

The core routing logic in `DomainRouter.tsx` will be inverted:

| Current | New |
|---------|-----|
| drive365.co.uk → Instructor routes | drive365.co.uk → Learner routes |
| everydriver.co.uk → Learner routes | everydriver.co.uk → Instructor routes |

```text
New Route Mapping:
+-----------------------+---------------------------+
| Domain                | Serves                    |
+-----------------------+---------------------------+
| drive365.co.uk        | Learner homepage + routes |
| everydriver.co.uk     | Instructor marketing + portal |
| *.everydriver.co.uk   | Mini-websites (unchanged) |
+-----------------------+---------------------------+
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/DomainRouter.tsx` | Swap DRIVE365_DOMAINS and EVERYDRIVER_DOMAINS logic; reverse redirect conditions |
| `src/components/ConditionalHome.tsx` | Swap which homepage shows on each domain |
| `src/components/layout/Header.tsx` | Add domain-aware logo/branding |
| `src/components/layout/Footer.tsx` | Add domain-aware branding and links |
| `src/components/instructor/InstructorMobileHeader.tsx` | Ensure EveryDriver branding for instructor app |
| `src/pages/instructor-app/Drive365Home.tsx` | Rename to `EveryDriverHome.tsx`, update branding |

### New Files to Create

| File | Purpose |
|------|---------|
| `src/pages/Drive365LearnerHome.tsx` | New learner homepage with Drive365 branding (based on current Index.tsx) |
| `public/drive365-logo.png` | Drive365 logo asset for learner site |

### Branding Logic

```text
Domain Detection Flow:
┌─────────────────────┐
│ User visits site    │
└──────────┬──────────┘
           │
     ┌─────▼─────┐
     │ Which     │
     │ domain?   │
     └─────┬─────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼───┐   ┌─────▼─────┐
│Drive365│   │EveryDriver│
└───┬───┘   └─────┬─────┘
    │             │
┌───▼───────┐ ┌───▼───────────┐
│Learner    │ │Instructor     │
│Homepage   │ │Marketing +    │
│+ Booking  │ │Portal         │
└───────────┘ └───────────────┘
```

### Capacitor Preparation for iOS

The everydriver.co.uk instructor portal will be optimized for Capacitor wrapping:

1. **Already installed**: The app has PWA capabilities
2. **Route isolation**: All instructor routes are already under `/instructor/*`
3. **Mobile-first UI**: InstructorMobileHeader and bottom nav already exist
4. **Prepare config**: Will document Capacitor setup with correct appId

---

## Implementation Steps

### Step 1: Update Domain Router Logic
- Modify `DomainRouter.tsx` to swap domain-to-route mappings
- DRIVE365 domains now serve learner routes
- EVERYDRIVER domains now serve instructor routes

### Step 2: Update Conditional Home Component
- Modify `ConditionalHome.tsx` to show:
  - Learner homepage on drive365.co.uk
  - Instructor marketing page on everydriver.co.uk

### Step 3: Create Domain-Aware Branding Hook
- Create `useDomainBranding.ts` hook that returns:
  - Logo path (drive365-logo.png vs everydriver-logo-v2.png)
  - Brand name ("Drive365" vs "EveryDriver")
  - Primary colors if different

### Step 4: Update Header and Footer
- Modify Header.tsx to use domain-aware branding
- Modify Footer.tsx to show appropriate links and branding per domain
- Update navigation links based on domain context

### Step 5: Rename/Refactor Marketing Pages
- Rename `Drive365Home.tsx` to `EveryDriverInstructorHome.tsx`
- Update all internal references to use EveryDriver branding
- Create new learner homepage variant for Drive365 if needed

### Step 6: Update Secondary Components
- Update `Drive365InstallBanner.tsx` references
- Update any hardcoded domain references in PWA manifests
- Update email templates or notification text if applicable

### Step 7: Document Capacitor Setup
- Provide Capacitor configuration for iOS app
- App will wrap everydriver.co.uk/instructor routes
- Enable hot-reload during development

---

## Branding Assets Needed

| Asset | Purpose |
|-------|---------|
| `drive365-logo.png` | Logo for learner site header/footer |
| `drive365-logo-dark.png` | Dark mode variant (optional) |

If you don't have a separate Drive365 logo, the current EveryDriver logo can be used with just text changes.

---

## Testing Checklist

After implementation, verify:
- [ ] drive365.co.uk shows learner homepage with postcode search
- [ ] drive365.co.uk/courses shows course listings
- [ ] drive365.co.uk/instructor redirects to everydriver.co.uk/instructor
- [ ] everydriver.co.uk shows instructor marketing page
- [ ] everydriver.co.uk/instructor shows instructor portal
- [ ] everydriver.co.uk/courses redirects to drive365.co.uk/courses
- [ ] Instructor mini-websites (*.everydriver.co.uk) still work
- [ ] PWA install prompts show correct branding per domain

---

## Future Considerations

### iOS App Wrapper (Capacitor)
Once domain swap is complete:
1. Export project to GitHub
2. Run `npx cap init` with appId: `app.lovable.ca10d01ecc994c0b9186351c493398b9`
3. Add iOS platform: `npx cap add ios`
4. Configure server URL for hot-reload during development
5. Build and deploy to App Store

### Potential Enhancements
- Separate PWA manifests per domain for distinct app icons
- Domain-specific theme colors (e.g., different primary color for Drive365)
- Analytics segmentation by domain

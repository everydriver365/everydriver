

# Plan: Enforce Drive365.co.uk as Learner-Only Domain

## Overview
Configure `drive365.co.uk` to exclusively serve learner content by redirecting all non-learner routes (instructor routes and any other non-shared routes) to `everydriver.co.uk`.

## Current State
The domain routing already handles:
- **drive365.co.uk** → Redirects instructor routes (`/instructor`, `/instructor-app`, `/install-instructor`) to everydriver.co.uk
- **everydriver.co.uk** → Redirects learner routes (`/courses`, `/pupil`, `/p/`, `/parent`, `/booking`, `/theory`) to drive365.co.uk
- **Shared routes** (like `/privacy-policy`, `/about`, `/contact`) stay on their current domain

## Problem
Currently, drive365.co.uk can still serve:
1. Shared routes (marketing pages, policies)
2. Admin routes (`/admin`)
3. Demo routes
4. Any routes not explicitly listed

## Proposed Solution

### Changes to `src/components/DomainRouter.tsx`

**Strategy**: Invert the logic for drive365.co.uk - instead of listing what to redirect away, explicitly allow only learner routes and shared routes, redirecting everything else.

```typescript
// New learner-allowed routes (comprehensive list)
const LEARNER_ALLOWED_ROUTES = [
  "/courses",
  "/pupil",
  "/p/",
  "/parent",
  "/booking",
  "/theory",
  "/book/",           // Booking flow
  "/booking-confirmation",
  "/intensives",
  "/semi-intensive",
  "/availability/",   // Public availability calendar
  "/sign/",           // Remote signing
  "/i/",              // Mini-website path routes (public)
];

// Shared routes remain as-is for both domains
const SHARED_ROUTES = [
  "/",
  "/.well-known",
  "/calendar-callback",
  "/privacy-policy",
  "/terms-of-service",
  "/about",
  "/contact",
  "/faqs",
  "/faq",
  "/help",
  "/services",
  "/reviews",
  "/benefits",
];
```

**Updated redirect logic for Drive365**:
```typescript
if (onDrive365) {
  // Check if route is explicitly allowed for learners OR is a shared route
  const isAllowedOnDrive365 = 
    LEARNER_ALLOWED_ROUTES.some(prefix => pathname.startsWith(prefix)) ||
    isSharedRoute(pathname);
  
  if (!isAllowedOnDrive365) {
    // Redirect any non-learner route to everydriver.co.uk
    window.location.href = `https://everydriver.co.uk${fullPath}`;
    return;
  }
}
```

### Files to Modify

| File | Change |
|------|--------|
| `src/components/DomainRouter.tsx` | Add `LEARNER_ALLOWED_ROUTES` array and update Drive365 redirect logic to use whitelist approach |

## Technical Details

### Routes Blocked on drive365.co.uk (will redirect to everydriver.co.uk)
- `/instructor/*` - All instructor portal routes
- `/instructor-app/*` - Instructor SaaS marketing pages
- `/install-instructor` - Instructor PWA install
- `/admin/*` - Admin portal
- `/hero-demo`, `/collage-demo`, etc. - Demo routes
- Any future routes not explicitly in the learner whitelist

### Routes Allowed on drive365.co.uk
- `/courses` - Course search and listing
- `/book/:instructorId` - Booking flow
- `/booking-confirmation` - Booking confirmation
- `/pupil/*` - Pupil portal
- `/p/:slug` - Branded pupil portal
- `/parent` - Parent portal
- `/theory` - Theory test prep
- `/intensives`, `/semi-intensive` - Course info pages
- `/availability/:token` - Public availability
- `/sign/:token` - Remote signing
- `/i/:slug/*` - Mini-website public pages
- All shared routes (privacy, terms, about, contact, FAQs, help)

## Testing Recommendations
After implementation, verify on drive365.co.uk:
1. Home page shows learner content (Index page, not instructor marketing)
2. `/courses` works correctly
3. `/instructor` redirects to everydriver.co.uk
4. `/admin` redirects to everydriver.co.uk
5. `/privacy-policy` and other shared routes work


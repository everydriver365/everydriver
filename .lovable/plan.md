

# Earlier Test Guarantee - Dedicated Page with CTA

## What changes

### 1. New page: `/earlier-test-guarantee`

Create `src/pages/EarlierTestGuarantee.tsx` -- a dedicated landing page explaining the guarantee in full detail:

- **Hero section** with the emerald gradient and the existing badge image, headline "Earlier Test Guarantee", and a clear subheading
- **How It Works** section with 3 steps: Book an intensive/semi-intensive course > We monitor DVSA cancellations > Get an earlier test date
- **The Guarantee** section explaining: if we cannot offer an earlier test slot at a test centre within 30 miles of their home address, they get the £62 test fee refunded
- **Key details** card covering eligibility (intensive and semi-intensive courses only), the 30-mile radius rule, and the £62 refund amount
- **CTA button** linking to `/courses` to book a course
- Consistent design using the emerald/teal gradient palette already established

### 2. Update the banner on desktop (`Index.tsx`)

Wrap the existing emerald banner in a `Link to="/earlier-test-guarantee"` so clicking it navigates to the new page.

### 3. Update the banner on mobile (`MobileHomepage.tsx`)

Change the banner's `onClick` from opening the modal to navigating to `/earlier-test-guarantee` using `useNavigate`. The existing modal can remain but will no longer be the primary action from the banner.

### 4. Add route

Register `/earlier-test-guarantee` in the app router.

## Technical details

**Files to create:**
- `src/pages/EarlierTestGuarantee.tsx`

**Files to modify:**
- `src/pages/Index.tsx` -- wrap banner in Link
- `src/components/MobileHomepage.tsx` -- change onClick to navigate
- `src/App.tsx` (or wherever routes are defined) -- add new route

No database changes required.


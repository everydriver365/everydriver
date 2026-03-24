

## Remove Website Add-on References from Public Pages

Strip website add-on rows from the `/compare` page and demo pricing page, keeping the in-dashboard marketplace (`/instructor/website-addons`) untouched.

### Changes

**1. Database: Delete website add-on rows from `comparison_features`**
- Remove any rows where `category` relates to website add-ons (Pro Website, Custom Domain, SSL Hosting, SEO Boost, Website Pro Pack)

**2. `src/pages/ComparisonPage.tsx`**
- Remove any hardcoded website/marketing add-on sections or references

**3. `src/pages/DemoPricingPage.tsx`**
- Remove website add-on feature rows from the hardcoded pricing grid

**4. No changes to:**
- `/instructor/website-addons` marketplace (stays as in-dashboard upsell)
- `useInstructorAddons.ts` hook (still powers dashboard add-on gating)
- `instructor_addons` table (unchanged)


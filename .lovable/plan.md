
## Website Choice During Onboarding

Replace the current domain/hosting section in Step 8 (StepWebsite) with a clean three-option toggle selector that lets instructors choose their website type upfront.

### The Three Options

1. **Free Mini-Website** (default, selected)
   - "Get a professional mini-website included free with your account at yourname.everydriver.co.uk. Includes booking page, reviews, and your profile."
   - Toggle selects this, flow continues as normal with theme/color choices.

2. **Custom Multi-Page Website + Domain**
   - "Want a full custom website with your own domain (e.g. yourname.co.uk)? We'll build you a bespoke multi-page site with your branding."
   - When selected, shows a green info box: "Great choice! We'll arrange this with you after sign-up is complete."
   - Removes the domain search, hosting packages, and related UI from this step.

3. **Book Now Button for Your Own Website**
   - "Already have your own website? We'll give you a 'Book Now' button you can add to your existing site to accept online bookings."
   - When selected, shows the same post-signup message: "We'll send you the button code and help you set it up after sign-up."

### How It Works

- The three options are presented as clickable cards with a radio-style toggle (similar to the existing theme selector pattern).
- Only the "Free Mini-Website" option shows the theme picker, color picker, and video upload sections below it.
- The "Custom" and "Book Now" options hide those sections and show a brief confirmation message instead.
- A new field `website_choice` (`"free"` | `"custom"` | `"booknow"`) is added to the onboarding data and saved to the instructor profile.

### Technical Details

**File changes:**

1. **`src/pages/instructor-app/onboarding/InstructorOnboarding.tsx`**
   - Add `website_choice: "free" | "custom" | "booknow"` to `OnboardingData` interface (default: `"free"`).

2. **`src/pages/instructor-app/onboarding/steps/StepWebsite.tsx`**
   - Replace the domain/hosting section (lines 260-475) with three toggle cards at the top of the step.
   - Conditionally show theme/color/video sections only when `website_choice === "free"`.
   - For `"custom"` or `"booknow"`, show a styled info card saying the arrangement happens post-signup.
   - Remove domain search, hosting packages, and related state/logic (no longer needed in this step).

3. **`src/pages/instructor-app/onboarding/OnboardingPreview.tsx`**
   - Pass updated data shape if needed (minor prop adjustment).

**No database migration needed** -- the `website_choice` value can be stored in the existing instructor profile JSON or as a simple text field added later when the feature matures.

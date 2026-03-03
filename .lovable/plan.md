

## Incomplete / Unwired Features Found

After auditing the full codebase, here are the components that were built but never wired into their parent views:

### 1. ReceiptScanner -- not used anywhere
`ReceiptScanner.tsx` exists with full camera capture + AI extraction via the `extract-receipt` edge function, but it is **never imported**. The `ExpenseTracker.tsx` has its own built-in file upload but does NOT call the `extract-receipt` edge function for AI-powered auto-categorisation. The AI extraction feature is completely disconnected.

**Fix:** Import `ReceiptScanner` into `ExpenseTracker.tsx` (or wire the `extract-receipt` call into the existing upload flow) so that when an instructor uploads/photographs a receipt, the AI auto-fills amount, date, category, and vendor.

### 2. DigitalTermsManager -- not used anywhere
`DigitalTermsManager.tsx` exists but is **never imported**. However, a more complete terms system already exists via `TermsSignatureModal`, `TermsConditionsEditor`, `SendSigningLinkButton`, and `RemoteSigning` page. This component appears redundant -- the digital terms feature is actually **fully implemented** through the other components.

**Fix:** Delete `DigitalTermsManager.tsx` as dead code, or repurpose it as a quick-status widget on pupil profiles (though `PupilCardStack` already shows signed/unsigned status).

### 3. TheoryMockScoreLogger -- not used anywhere
`TheoryMockScoreLogger.tsx` exists with a form to log mock test scores and a bar chart, but is **never imported** into any page. Pupils have no way to log mock scores.

**Fix:** Add it to `BrandedPupilPortal.tsx` in the Theory tab alongside the existing `TheoryProgressChart`.

### 4. PupilCheckInCard -- missing from BrandedPupilPortal
The check-in card is wired into `PupilPortal.tsx` (the old portal) but **not** into `BrandedPupilPortal.tsx` (the branded portal that most pupils actually use). Pupils on branded portals never see the check-in prompt.

**Fix:** Import and render `PupilCheckInCard` in `BrandedPupilPortal.tsx` near the top of the home tab.

### 5. LessonCheckInBadge -- missing from NewMobileScheduleView
The badge shows on `TodayScheduleView.tsx` but **not** on `NewMobileScheduleView.tsx` (the mobile schedule that instructors actually use on phones). Instructors on mobile don't see check-in status.

**Fix:** Import and render `LessonCheckInBadge` in `NewMobileScheduleView.tsx` lesson cards.

### 6. Post-Lesson Feedback -- no Google Review prompt
`PupilFeedbackPrompt` collects ratings but never prompts high-raters (4-5 stars) to leave a Google or Trustpilot review. The plan called for this but it was not built.

**Fix:** After a pupil submits a 4+ star rating, show a "Leave us a Google Review" link (using the instructor's Google Maps place URL if configured).

### Summary of work

| # | Issue | Effort |
|---|-------|--------|
| 1 | Wire AI receipt extraction into ExpenseTracker | Medium |
| 2 | Delete unused DigitalTermsManager (redundant) | Trivial |
| 3 | Add TheoryMockScoreLogger to BrandedPupilPortal | Small |
| 4 | Add PupilCheckInCard to BrandedPupilPortal | Small |
| 5 | Add LessonCheckInBadge to NewMobileScheduleView | Small |
| 6 | Add Google Review prompt after high feedback | Small |


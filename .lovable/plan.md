

## Plan: Add All Missing Features to Comparison Table

### Audit Results
Cross-referencing the app's codebase against the current `comparison_features` table reveals **~18 features** that exist in the platform but are missing from the comparison table.

### Missing Features (grouped by category)

**Business Tools** (add to existing):
| Feature | Free | All-In | GPS | Single | Duo | Multi |
|---------|------|--------|-----|--------|-----|-------|
| Xero / QuickBooks / Sage export | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Bookable quotes | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Deposit payments | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Dynamic pricing rules | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Intake questions | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Drive-time alerts | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| AI Receptionist (live chat) | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Instant Bank Pay (GoCardless) | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Direct Debit for pupils | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Pupil & Parent** (add to existing):
| Feature | Free | All-In | GPS | Single | Duo | Multi |
|---------|------|--------|-----|--------|-----|-------|
| Post-lesson feedback | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Reflective logs | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Voice notes on lessons | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Pupil self-booking | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Course completion bonus (£50) | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Tools & Wellbeing** (add to existing):
| Feature | Free | All-In | GPS | Single | Duo | Multi |
|---------|------|--------|-----|--------|-----|-------|
| Morning briefing (AI) | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Auto re-engagement SMS | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Offline sync & PWA | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Cancellation analytics | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |

### Implementation
Single database INSERT of ~18 rows into `comparison_features` with correct `plan_values` JSONB, categories, and display orders. No code changes needed — the comparison page and admin editor already render dynamically.

### Files Changed
| File | Change |
|------|--------|
| Database (comparison_features) | INSERT ~18 rows |
| No code changes | UI reads dynamically |


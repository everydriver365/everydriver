

## Plan: Add Remaining Missing Features to Comparison Table

### Audit Summary
Cross-referencing the Discover Features list (44 features), Feature Toggles (13 toggles), and all app pages against the current comparison_features table reveals **~14 features** still missing.

### Missing Features by Category

**Business Tools** (add to existing):
| Feature | Free | All-In | GPS | Single | Duo | Multi |
|---------|------|--------|-----|--------|-----|-------|
| Lesson packages & bundles | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| No-show & cancellation policy | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Workflow automations | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Payment reminders | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Lesson Tracking** (add to existing or new category):
| Feature | Free | All-In | GPS | Single | Duo | Multi |
|---------|------|--------|-----|--------|-----|-------|
| Standards Check prep | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| CPD logging | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Lesson notes & templates | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Tools & Navigation** (new category):
| Feature | Free | All-In | GPS | Single | Duo | Multi |
|---------|------|--------|-----|--------|-----|-------|
| Built-in SatNav | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Find nearby (toilets, cafés) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Find cheapest fuel | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Weather alerts | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Community road alerts | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Digital checklists (vehicle/incident) | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Document vault | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Growth & Community** (add to existing or new):
| Feature | Free | All-In | GPS | Single | Duo | Multi |
|---------|------|--------|-----|--------|-----|-------|
| Test swap marketplace | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Nearby ADIs map | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| GPS Clock in/out | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |

### Already Covered (no action needed)
Features like SatNav, Find Fuel, Weather, Checklists, Document Vault, Clock In/Out, Test Swap, and Nearby ADIs exist as pages/components but were never added to the comparison table.

### Implementation
Single database INSERT of ~17 rows into `comparison_features` with correct categories, plan_values JSONB, and display_orders. No code changes — the UI renders dynamically.

### Files Changed
| File | Change |
|------|--------|
| Database (comparison_features) | INSERT ~17 rows |
| No code changes | UI reads dynamically |


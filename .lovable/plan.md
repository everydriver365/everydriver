

## Plan: Add Missing Features to Comparison Table

### Problem
~25 platform features are built and functional but missing from the `comparison_features` database table, making the comparison page incomplete.

### Solution
Insert the missing features into `comparison_features` via a database migration, grouped into appropriate categories. No code changes needed — the comparison page and admin editor already render dynamically from the database.

### New Features to Add (by category)

**Business Tools** (add to existing category):
| Feature | Free | All-In | GPS | Single | Duo | Multi |
|---------|------|--------|-----|--------|-----|-------|
| SMS notifications & gap filling | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Expense tracking & tax reports | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Custom .co.uk domain | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Google Calendar sync | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Klarna & Clearpay (BNPL) | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Digital waivers & consent forms | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Daily manifest & EOD reports | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Abandoned checkout remarketing | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Pupil & Parent** (new category):
| Feature | Free | All-In | GPS | Single | Duo | Multi |
|---------|------|--------|-----|--------|-----|-------|
| Pupil rewards & referral codes | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Waiting list management | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Certification & milestone tracking | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Earliest slot preference | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| DL25A test result logging | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**GPS & Tracking** (add to existing category):
| Feature | Free | All-In | GPS | Single | Duo | Multi |
|---------|------|--------|-----|--------|-----|-------|
| Find My Car | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| Vehicle health & diagnostics | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| Saved lesson routes | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| Impact detection (G-force) | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| Speed heatmap | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| Fuel & efficiency tracking | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| Trip-to-lesson auto-linking | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |

**Tools & Wellbeing** (new category):
| Feature | Free | All-In | GPS | Single | Duo | Multi |
|---------|------|--------|-----|--------|-----|-------|
| Health & Wellbeing hub | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Instructor forum | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Jotter / doodle pad | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Job offers marketplace | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### Implementation
Single database migration with ~25 INSERT statements into `comparison_features`. Display orders will be set to append within each category.

### Files Changed
| File | Change |
|------|--------|
| Migration SQL | INSERT ~25 rows into `comparison_features` |

No code changes — the page and admin editor already handle dynamic data.


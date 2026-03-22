

## Plan: Add Final Missing Features to Comparison Table

### The Problem
You're right to be frustrated — I've been doing partial scans. This time I cross-referenced every single entry in the Discover Features list (44 features) against every row in the `comparison_features` table to find the gaps.

### Features Still Missing (~10)

**Scheduling**:
| Feature | Free | All-In | GPS | Single | Duo | Multi |
|---------|------|--------|-----|--------|-----|-------|
| Fill Gaps (broadcast open slots) | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Plan Ahead (tomorrow's route) | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Business Tools**:
| Feature | Free | All-In | GPS | Single | Duo | Multi |
|---------|------|--------|-----|--------|-----|-------|
| Month End financial reports | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Tools & Navigation**:
| Feature | Free | All-In | GPS | Single | Duo | Multi |
|---------|------|--------|-----|--------|-----|-------|
| Saved locations & meeting points | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Wellbeing & burnout tracker | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| To Do list | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tasks Due (outstanding follow-ups) | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Reports & Insights** (new category):
| Feature | Free | All-In | GPS | Single | Duo | Multi |
|---------|------|--------|-----|--------|-----|-------|
| AI Weekly Report | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| End of Day report | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Growth & Community**:
| Feature | Free | All-In | GPS | Single | Duo | Multi |
|---------|------|--------|-----|--------|-----|-------|
| Team Channels (group messaging) | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| Waiting Room (weekly Zoom) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### Implementation
Single INSERT of ~11 rows into `comparison_features`. No code changes needed.

### Files Changed
| File | Change |
|------|--------|
| Database (comparison_features) | INSERT ~11 rows |
| No code changes | UI reads dynamically |


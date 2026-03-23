

## Plan: Add AI & Automation Features to Comparison Table

### What's Changing
Add new AI-powered feature rows to the comparison matrix, grouped under a new **"AI & Automation"** category. These are the features discussed earlier that no competitor offers.

### New Features to Insert (via insert tool)

All features will be **free: false, all other paid plans: true** (GPS and above get AI features).

| # | Feature Name | Category |
|---|---|---|
| 1 | AI lesson plan generator | AI & Automation |
| 2 | Test readiness predictor | AI & Automation |
| 3 | Smart pricing suggestions | AI & Automation |
| 4 | Cancellation risk alerts | AI & Automation |
| 5 | AI parent progress reports | AI & Automation |
| 6 | Smart waitlist gap filling | AI & Automation |
| 7 | Auto-invoice generation | AI & Automation |

### Existing AI features stay where they are
These already exist in other categories and won't be moved:
- AI Weekly Report (Reports & Insights)
- Morning briefing AI (Tools & Wellbeing)
- AI Receptionist (Business Tools)
- Auto re-engagement SMS (Tools & Wellbeing)
- Cancellation analytics (Tools & Wellbeing)

### Database Operations
7 INSERT statements into `comparison_features` with display_order 143–149, category "AI & Automation", and plan_values giving all paid plans `true` and free `false`.

### No code changes needed
The comparison page renders dynamically from the database.


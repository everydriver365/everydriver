

## Recommendation: Demo Mode Toggle (not mock data seeding)

Given your live-data-integrity policy, **seeding real mock data into the database is risky** — it mixes fake records with real ones, complicates cleanup, and could leak into reports/payments. Instead, I recommend a **Demo Mode toggle** that overlays realistic sample data client-side without touching the database.

### How It Works

1. **New instructor signs up** → after onboarding, their portal is empty (no pupils, lessons, payments)
2. A **"Try Demo Mode"** banner appears on their dashboard, inviting them to explore
3. Toggling it ON overlays sample data across all key pages — pupils, schedule, income, etc.
4. Toggling it OFF instantly returns to their real (empty) data
5. A persistent amber banner reminds them they're in demo mode

### What the Instructor Sees in Demo Mode

- **Dashboard**: Sample stats (12 pupils, 6 lessons this week, £1,240 earned this month)
- **Pupils list**: 5-6 realistic sample pupils with progress, balances, lesson history
- **Schedule/Diary**: Sample lessons for today and this week
- **Income/Pay**: Sample payment history and earnings breakdown
- **Messages**: Sample conversation threads

All clearly marked as demo data — no database writes, no confusion.

### Implementation
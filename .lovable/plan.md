## Stabilisation plan

I will stop making isolated schedule/calendar changes and treat this as one controlled repair.

### 1. Freeze risky changes
- No lesson deletes, restores, cancellations, resyncs, or date-rendering changes without explicit approval.
- No database mutations until the exact affected lessons are listed and agreed.

### 2. Audit the current truth
- Compare DSM lesson rows against Google Calendar events for the affected instructor.
- Focus on the dates already raised: 8 June, 9/10 June, 12 June, 27/28 June, and 4/5 July.
- Produce a clear mismatch list:
  - Exists in DSM and Google
  - Exists only in Google
  - Exists only in DSM
  - Cancelled/deleted in DSM
  - Displayed at the wrong time/date

### 3. Identify the display fault
- Check the DSM Home page query separately from the Schedule page query.
- Confirm why Joseph appears in Google Calendar and DSM Schedule but not DSM Home.
- Check whether Home is intentionally reading only DSM `scheduled_lessons`, while Schedule is also showing Google Calendar events.

### 4. Repair with one approved action list
After the audit, I will ask you to approve a precise repair list, for example:
- restore specific cancelled DSM lessons,
- create missing DSM lesson rows for Google-only real lessons,
- remove/ignore incorrect Google-only entries,
- fix the Home page to show the right source if that is the chosen behaviour.

### 5. Add guardrails so this does not keep happening
- Keep Google Calendar as the busy/availability source.
- Keep DSM lessons as the lesson/business-record source unless you explicitly approve a merged Home-page behaviour.
- Add a visible “Google-only lesson” state only if approved, so manual calendar events cannot silently look like fully booked DSM lessons.

### Technical notes
- I will not use hard-coded fallback lesson data.
- I will not change mobile layouts unless required for the bug.
- I will not alter payment, pupil balance, or lesson financial records during this repair.
- Any database change will be limited to the specific lessons you approve.

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>
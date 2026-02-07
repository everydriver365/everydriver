

## Data Protection and Scalability Improvements

This plan adds automated backups, soft deletes on critical tables, removes query limits, adds performance indexes, and creates an audit trail -- all to protect your 7,000+ users' data from loss.

---

### 1. Activate Weekly Backup Cron Job

The weekly backup email function exists but is never triggered automatically. We'll schedule it to run every Sunday at 2am.

**Database change:** Insert a `pg_cron` schedule that calls the existing `weekly-backup-email` edge function weekly.

---

### 2. Remove Backup Query Limits

The backup function currently caps exports at 500 rows per table. For instructors with thousands of lessons/payments, this silently drops data. We'll remove all `.limit(500)` calls from the backup edge function so every record is included.

---

### 3. Add Soft Deletes to Critical Tables

Currently, deleting a pupil, lesson, or payment permanently erases it. We'll add a `deleted_at` timestamp column to these tables:

- **pupils**
- **lesson_history**
- **scheduled_lessons**
- **payment_history**
- **instructor_expenses**

Records won't be physically removed -- instead `deleted_at` gets set to `now()`. All existing queries that read from these tables will be updated to filter out soft-deleted rows (`.is("deleted_at", null)`).

The most critical delete operations to convert (based on codebase analysis):
- Pupil deletion in `InstructorPupils.tsx`
- Payment deletion in `PupilRecordsManager.tsx`
- Lesson deletions across scheduling components

---

### 4. Create Audit Log Table

A new `data_audit_log` table will track all significant changes (creates, updates, deletes) on critical tables, storing:
- Who made the change (instructor ID)
- What table/record was affected
- What the action was (insert/update/delete)
- Old and new values
- Timestamp

This provides a recoverable history if anything goes wrong.

---

### 5. Add Performance Indexes

For 7,000 users, we'll add indexes on the most queried columns:
- `pupils(instructor_id, deleted_at)`
- `lesson_history(instructor_id, lesson_date, deleted_at)`
- `scheduled_lessons(instructor_id, lesson_date, deleted_at)`
- `payment_history(instructor_id, recorded_at, deleted_at)`
- `instructor_expenses(instructor_id, expense_date, deleted_at)`

---

### Technical Summary

| Change | Type | Files Affected |
|--------|------|---------------|
| Cron job for backups | SQL (insert) | Database only |
| Remove .limit(500) | Edge function | `weekly-backup-email/index.ts` |
| Soft delete columns | SQL migration | 5 tables |
| Update delete calls to soft delete | Frontend code | ~15 components |
| Audit log table | SQL migration | New table |
| Audit logging helper | Frontend code | New utility + existing delete/update calls |
| Performance indexes | SQL migration | 5 tables |


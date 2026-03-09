

## Fix: Pupil Registration "Failed to create account" Error

### Root Cause
The edge function logs show: `null value in column "address" of relation "pupils" violates not-null constraint`. When a new pupil self-registers, the insert only provides `name`, `email`, and `instructor_id` -- but the `address` and `postcode` columns are NOT NULL with no defaults.

### Solution
Run a database migration to make `address` and `postcode` nullable, since a self-registering pupil won't have these details yet. The instructor can fill them in later.

```sql
ALTER TABLE public.pupils ALTER COLUMN address DROP NOT NULL;
ALTER TABLE public.pupils ALTER COLUMN postcode DROP NOT NULL;
```

No edge function or frontend changes needed.

### Why not default to empty string?
Empty strings would pass the constraint but create dirty data. Nullable is cleaner -- it distinguishes "not provided yet" from "intentionally blank."


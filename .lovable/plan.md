

## Plan: Set Free Plan to Unlimited Pupils

### What's Changing
Update two comparison feature rows in the database so the Free plan shows **"Unlimited"** pupils instead of "100" or a checkmark.

### Database Updates (via insert tool)

**1. Update "Maximum pupils" row** — change `free` from `100` to `"Unlimited"`
```sql
UPDATE comparison_features 
SET plan_values = jsonb_set(plan_values, '{free}', '"Unlimited"')
WHERE id = '01a4ada8-4e90-451c-a4a8-11183d44790c';
```

**2. Update "Active pupils" row** — change `free` from `true` to `"Unlimited"` for consistency
```sql
UPDATE comparison_features 
SET plan_values = jsonb_set(plan_values, '{free}', '"Unlimited"')
WHERE id = 'a95259e6-df85-4383-8633-079e9e4a3d9f';
```

No code changes needed — the comparison page renders dynamically from the database. The `subscription_plans.max_pupils` is already `NULL` (unlimited) for the free plan.


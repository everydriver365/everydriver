

## Plan: Backfill Drive365 Subdomains for All Instructors

### Problem
Ken D and 4 other instructors were onboarded before the auto-domain feature was added, so their `custom_domain` field is null. The website URL falls back to the Lovable preview domain instead of showing `ken-d.drive365.co.uk`.

### Fix

#### 1. Backfill custom_domain for all 5 instructors

Using the database insert tool, run UPDATE statements to set `custom_domain` and `custom_domain_verified` for each:

| Instructor | Slug | Domain |
|-----------|------|--------|
| Ken D | ken-d | ken-d.drive365.co.uk |
| John Smith (accounts) | accounts | accounts.drive365.co.uk |
| John Smith (herts) | herts | herts.drive365.co.uk |
| Martin B | test-instructor | test-instructor.drive365.co.uk |
| Sarah Mitchell | sarah-mitchell | sarah-mitchell.drive365.co.uk |

```sql
UPDATE instructors SET custom_domain = app_slug || '.drive365.co.uk', custom_domain_verified = true
WHERE custom_domain IS NULL AND app_slug IS NOT NULL;
```

#### 2. No code changes needed

The existing `websiteUrl` logic in `InstructorMiniWebsiteSettings.tsx` already checks `custom_domain` first — once the data is populated, the correct URL will display automatically.

### Result
- Ken D's website settings page will show `https://ken-d.drive365.co.uk`
- The "View Live Site" button will link to the correct domain
- The Website Pages tile will show correct URLs
- All other instructors also get their proper drive365 subdomain


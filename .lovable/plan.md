## Mirror Drive365 homepage into EveryDriver

Scope confirmed: DSM stays for instructors/schools/admin. EveryDriver is learner-only. Drive365 is being abandoned.

### Changes

1. **`src/pages/everydriver/Index.tsx`** — replace entire file with a one-line re-export so EveryDriver `/` renders the Drive365 homepage live and stays in sync forever:
   ```ts
   export { default } from "@/pages/Index";
   ```

2. **`src/pages/Index.tsx`** — rebrand visible learner copy "Drive365" → "EveryDriver" (headings, body text, franchise CTA blocks around lines 892 and 946). Change `source="drive365"` analytics prop to `source="everydriver"`. Leave asset import variable names and `/drive365/franchise` link alone (still works).

3. **`src/components/home/Drive365Home.tsx`** — same visible-text sweep, "Drive365" → "EveryDriver".

### Out of scope
- DSM portals (instructor, school, admin chrome) — untouched
- `/drive365/*` routes — kept as working aliases so old links don't 404
- The old bespoke EveryDriver homepage file contents — replaced by re-export

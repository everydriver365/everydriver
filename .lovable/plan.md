

## Plan: Website Add-On Monetisation — Monthly Upsells ✅ IMPLEMENTED

### What Was Built
1. **`instructor_addons` table** — tracks active monthly add-ons per instructor with RLS
2. **`useInstructorAddons` hook** — fetches active add-ons, provides `hasAddon()` helper (bundle auto-includes all 4)
3. **`InstructorWebsiteAddons` page** — marketplace showing 4 individual cards + bundle with activation
4. **Route** `/instructor/website-addons` added to routes
5. **Sidebar** — "Website Add-Ons" nav item added under TOOLS (highlighted)
6. **Comparison matrix** — 5 new rows added for each add-on with pricing

### Add-Ons
| Add-On | Price |
|--------|-------|
| Pro Website | £4.99/mo |
| Custom Domain | £1.99/mo |
| SSL + Hosting | £2.99/mo |
| SEO Boost | £3.99/mo |
| **Website Pro Pack** | **£9.99/mo** (save £3.96) |

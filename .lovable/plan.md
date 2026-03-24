

## Update Plan Pricing to Recommended Levels

Update the three paid tier prices in the database and ensure the comparison page reflects the new pricing.

### Price Changes
- **All-In**: £4.99 → **£7.99**/mo
- **GPS + Health**: £29.99 → **£34.99**/mo  
- **Dashcam + Health**: £49.99 → **£59.99**/mo

### What This Does to Margins
| Tier | Revenue | Est. Costs | Profit | Margin |
|------|---------|------------|--------|--------|
| All-In | £7.99 | ~£0.50 | ~£7.49 | 94% |
| GPS + Health | £34.99 | ~£21–23 | ~£12–14 | 34–40% |
| Dashcam + Health | £59.99 | ~£42 | ~£17.99 | 30% |

### Technical Steps

1. **Update `comparison_plans` table** — run three UPDATE statements via the insert tool to change the `price` column for the `all-in`, `gps-health`, and `dashcam-health` plan slugs.

2. **Verify the comparison page** — since the `/compare` page reads pricing dynamically from the database, no code changes are needed. The new prices will render automatically.

3. **Check for any hardcoded price references** — search the codebase for `£4.99`, `£29.99`, `£49.99` strings and update any that appear outside the dynamic comparison table (e.g. marketing copy, CTAs, or GoCardless payment amounts).




## Cash Flow Forecast PDF — 1,000 Subscriber Scenario

Generate a detailed PDF cash flow forecast for Threesixfive (365) for the 2026/27 tax year, modeled on capturing ~1,000 subscribers from Total Drive's market, with a tier breakdown.

### Assumptions

- **Starting subscribers**: 0 (new market capture)
- **Growth**: ~83 new subscribers/month to reach ~1,000 by year-end
- **Churn**: 3% monthly
- **Tier mix** (based on typical SaaS distribution):
  - Free (£0 sub, 2% + 25p tx fee): 30%
  - All-In £7.99/mo (1.5% + 25p tx fee): 45%
  - GPS + Health £34.99/mo: 15%
  - Dashcam + Health £54.99/mo: 10%
- **Platform tx fees**: Based on avg £2,500/mo lesson volume per instructor
- **Provider costs**: Benenden £15.50/mo (GPS tier), AXA £25.00/mo (Dashcam tier), Dashcam hardware £17.00/mo
- **Fixed OpEx**: £6,500/mo (hosting, support, marketing, dev)
- **Variable costs**: GoCardless £0.50/subscriber

### Output

A professionally branded PDF with:
1. Executive summary with key metrics
2. Monthly breakdown table (subscribers by tier, revenue streams, costs, net profit)
3. Year-end totals and profit margin

### Technical approach

Python script using `reportlab` to generate the PDF, saved to `/mnt/documents/cashflow-forecast-1000-subs.pdf`.


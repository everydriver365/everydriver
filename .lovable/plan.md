

## Plan: Create Benenden Health Benefits Sales Page

### What We're Building
A new public-facing page at `/health-benefits` that presents the Benenden Healthcare for Business offering as an employee benefit for driving instructors. The page will be a polished, conversion-focused landing page with all the key data extracted from the brochure.

### Page Structure

| Section | Content |
|---------|---------|
| **Hero** | "Healthcare for Your Business" headline, £15.50/month price callout, CTA to enquire |
| **Why Invest** | 5 benefit cards: Reduce sick days, Improve retention, Increase productivity, Attract talent, Peace of mind |
| **What's Included** | Grid of 12 service tiles with icons: 24/7 GP, Mental Health Helpline, Adult Care, Neurodiversity Advice, Medical Diagnostics (up to £2,500), Surgical Treatment, Physiotherapy (up to 6 sessions), Mental Health Support (up to 6 sessions), Cancer Advice, Employee Rewards, Health App, Wellbeing Hub |
| **Service Details** | Expandable accordion for each service with overview, what's included, what's excluded |
| **Key Stats** | 180,451 members helped in 2024, 870,000+ members, 120 years experience, 4.6 Trustpilot rating, 7 years "Best Healthcare Service" |
| **Pricing** | Simple pricing card: £15.50/employee/month, no excesses, no age loading, family add-on option |
| **FAQs** | Accordion with key questions from the brochure |
| **CTA** | Contact section with phone (0808 256 2910) and email (sales.support@benenden.co.uk) |

### Technical Details

| Item | Detail |
|------|--------|
| **New file** | `src/pages/HealthBenefitsPage.tsx` |
| **Route** | Add `/health-benefits` to `publicRoutes.tsx` |
| **Layout** | Standalone public page with Drive365 header/footer styling |
| **Icons** | Lucide icons for each service tile |
| **Animations** | Framer Motion fade-in on scroll |
| **No database needed** | All content is static, extracted from the brochure |


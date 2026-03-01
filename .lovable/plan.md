

## Plan: Integrate All Major Accountancy Packages

Currently the app only has a Xero CSV export component. The plan is to expand the Export tab to support CSV exports compatible with **Xero**, **QuickBooks Online**, **FreeAgent**, and **Sage Business Cloud** -- all via downloadable CSV files formatted to each platform's import specification.

### What will be built

1. **New `AccountingExport` component** replacing the current `XeroExport` -- a unified export card with a platform selector (tabs or dropdown) for Xero, QuickBooks, FreeAgent, and Sage. Each platform generates CSVs with the correct headers, date formats, and account codes:

   - **Xero**: Current format (already done) -- `*Date`, `*Amount`, `Description`, `Reference`, `Account Code`, `Tax Rate`
   - **QuickBooks Online**: `Date`, `Description`, `Amount`, `Category`, `Ref Number`
   - **FreeAgent**: `Dated on`, `Description`, `Gross Value`, `Category`, `Sales Tax Rate`
   - **Sage**: `Date`, `N/C` (nominal code), `Reference`, `Details`, `Net Amount`, `Tax Code`

2. **Platform-specific account code mappings** for each software (e.g. Fuel = Xero 429, QBO "Car & Van Expenses", FreeAgent "Motor Expenses", Sage 7300).

3. **Income + Expense exports** for each platform, same as the current Xero export but with platform-specific formatting.

4. **Update the Export tab** in `InstructorAccounts.tsx` to use the new unified component instead of `XeroExport`, removing the Xero-only sidebar info and replacing with a generic "Accounting Software Export" section.

5. **"Coming Soon" note** for direct OAuth API integrations remains, but now mentions all four platforms.

### Files changed

- **New**: `src/components/instructor/AccountingExport.tsx` -- unified export component with platform selector
- **Edit**: `src/pages/InstructorAccounts.tsx` -- swap `XeroExport` for `AccountingExport` in the Export tab
- **Keep**: `src/components/instructor/XeroExport.tsx` -- left as-is for backward compatibility (but no longer rendered directly)

### No database or backend changes required
This is purely client-side CSV generation using existing expense and lesson data.


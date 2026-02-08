

# Import Invoices into Expenses

## What This Does
Lets instructors upload invoice files (PDFs, photos, documents) from their phone -- including files saved from email -- and automatically reads the invoice to fill in expense details (amount, date, category, description).

## How It Works

1. **Expanded file upload** -- The "Upload" button will accept PDFs and images (not just photos). On a phone, this opens the system file picker where instructors can browse Downloads, Files, Google Drive, iCloud, etc. Invoices saved from email apps appear here automatically.

2. **"Import Invoice" button** -- A new prominent button alongside "Take Photo" and "Upload" that specifically guides the user to pick a document.

3. **AI-powered reading** -- After uploading, the system sends the file to an AI model which extracts:
   - Total amount
   - Invoice date
   - Vendor/supplier name (used as description)
   - Suggested category (Fuel, Insurance, Vehicle Maintenance, etc.)

4. **Auto-fill form** -- The extracted details pre-fill the expense form. The instructor can review and adjust before saving.

5. **Document preview** -- PDFs show a document icon with filename instead of an image preview. Images continue to show a visual preview.

## Technical Details

### File: `src/components/instructor/ExpenseTracker.tsx`
- Expand `accept` attribute from `image/*` to `image/*,.pdf,.doc,.docx`
- Remove the `image/*` validation check; allow PDFs and common doc types (max 10MB)
- Add a third button: "Import Invoice" with a `FileText` icon
- After file selection, if not an image, show a document placeholder with filename
- Add an "Extract Details" button that calls the backend function
- Auto-populate form fields from the AI response

### New Edge Function: `supabase/functions/extract-invoice-data/index.ts`
- Receives the file URL (from storage) or base64 content
- Uses Lovable AI (google/gemini-2.5-flash -- strong at document reading, cost-effective) to extract:
  - `amount` (number)
  - `date` (YYYY-MM-DD)
  - `description` (vendor/supplier name + brief summary)
  - `category` (matched to existing categories: Fuel, Vehicle Maintenance, Insurance, etc.)
- Returns JSON with extracted fields
- Falls back gracefully if extraction fails (user can still fill manually)

### Storage
- The existing `expense-receipts` bucket already accepts uploads -- no changes needed there
- PDFs and documents will be stored alongside receipt images

### No Database Changes Required
- The existing `instructor_expenses` table already has all needed columns
- `receipt_url` stores the link to the uploaded file (works for PDFs too)

## User Flow

```text
1. Instructor taps "Add Expense"
2. Sees three options: "Take Photo" | "Upload File" | "Import Invoice"
3. Taps "Import Invoice" --> phone file picker opens
4. Selects a PDF invoice from Downloads (saved from email)
5. File uploads, document preview shown
6. "Extract Details" button appears --> taps it
7. AI reads the invoice, form auto-fills with amount, date, category
8. Instructor reviews, adjusts if needed, taps "Save Expense"
```


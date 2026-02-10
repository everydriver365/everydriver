

# Editable Quartix Setup Guide for Resources

## What You're Asking
You want to take the content from the Quartix Plug & Track installation PDF, present it in an editable form within the app so you can customise certain parts (e.g. contact details, support info, branding), and then save the finished document into the instructor's Resources section.

## How It Will Work

1. **New "Document Templates" page** at `/instructor/document-templates` with a pre-loaded Quartix setup guide template
2. The template displays the guide content in editable fields -- you can change things like:
   - Support contact details (replace Quartix's email/phone with your own or keep them)
   - Add your own notes or instructions for pupils
   - Customise the title and section headings
3. A **"Save to Resources"** button that generates a PDF from the edited content and uploads it to the Resources section automatically

## What Gets Built

### 1. Document Template Page (`src/pages/InstructorDocumentTemplates.tsx`)
- Pre-populated with the Quartix guide content split into editable sections:
  - **Title** (editable text)
  - **Installation Steps** (editable numbered list)
  - **Device Setup Info** (editable text block with serial number instructions, support email, etc.)
  - **Safety Summary** (editable text block)
  - **Compatibility Notes** (editable text)
- Live preview panel showing how the document will look
- "Save to Resources" button that generates a PDF using the existing `jspdf` library and uploads it to the `instructor-resources` storage bucket

### 2. PDF Generation
Using the already-installed `jspdf` and `jspdf-autotable` packages to render the edited content into a clean, branded PDF with:
- EveryDriver header/branding (or instructor's own branding)
- Formatted sections matching the original guide layout
- Automatic upload to Resources with category set to "Training Materials"

### 3. Route and Navigation
- Add route `/instructor/document-templates`
- Add a "Templates" or "Create Document" button on the Resources page that links to the templates page
- After saving, redirect back to Resources where the new document appears

## Files to Create/Modify

| File | Change |
|------|--------|
| `src/pages/InstructorDocumentTemplates.tsx` | **New** -- Editable template page with Quartix guide pre-loaded |
| `src/pages/InstructorResources.tsx` | Add "Templates" button linking to document templates |
| `src/App.tsx` | Add route for `/instructor/document-templates` |

## Technical Notes
- The original PDF images (diagrams of the OBD port, device photos) won't be embedded since they're copyrighted Quartix assets -- the text content will be fully editable though
- The generated PDF uses `jspdf` which is already installed
- The document saves directly into the existing Resources infrastructure (same storage bucket, same database table)
- No database changes needed -- it reuses the existing `instructor_resources` table

where there are images, let me replace the existing images and logos with my own

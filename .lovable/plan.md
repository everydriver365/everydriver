

## Interactive Booking Flow in WhatsApp Widget

When a visitor clicks "I'd like to book", the widget will switch to a multi-step booking flow embedded directly in the chat, rather than sending a plain text message.

### Flow

```text
Step 1: Postcode Input
  "Where are you based?" + postcode text field + Submit

Step 2: Course Selection
  Grid of 5 course option buttons:
  - 10 Hours
  - 20 Hours
  - 30 Hours
  - 40 Hours
  - Test in a Week

Step 3: Results
  Query the database for available instructors near postcode,
  display compact course tiles inside the widget.
  Each tile shows: instructor name, price, next available date, transmission type.
  Tapping a tile navigates to /book/{instructorId}?hours=X&date=Y
```

### Technical Changes

**File: `src/components/whatsapp/WhatsAppChatWidget.tsx`**

1. Add booking flow state:
   - `bookingStep`: `null | "postcode" | "course" | "results"`
   - `bookingPostcode`: string
   - `bookingHours`: number
   - `bookingResults`: array of course results

2. Intercept "I'd like to book" click: instead of calling `handleSendMessage`, set `bookingStep = "postcode"` and insert a local "bot" message bubble saying "Where are you based? Enter your postcode below."

3. Render step-specific UI at the bottom of the chat area:
   - **Postcode step**: Replace the text input area with a postcode input + "Search" button. On submit, set `bookingStep = "course"`.
   - **Course step**: Show 5 styled buttons (10hr, 20hr, 30hr, 40hr, Test in a Week). On click, query the database and set `bookingStep = "results"`.
   - **Results step**: Query `instructors` (active, near postcode using geocoding via the existing postcode lookup pattern), `instructor_courses`, `instructor_working_hours`, and `instructor_date_overrides`. Use the same `findFirstAvailableDate` logic from `useFeaturedCourses`. Display up to 4 compact course tiles inside the chat scroll area.

4. Create a new `WhatsAppBookingCard` sub-component for the mini course tile rendered inside the chat. It will show:
   - Course badge image (reuse existing badge assets)
   - Instructor name + avatar
   - Price
   - Next available date
   - "View Details" button that navigates to `/book/{instructorId}?hours=X&date=Y`

5. Add a "Back" / "Cancel" option to return to normal chat at any step.

**New file: `src/components/whatsapp/WhatsAppBookingCard.tsx`**
- Compact card component sized for the chat widget (~300px wide)
- Uses the same badge images (10hr, 20hr, etc.) from existing assets
- Shows instructor avatar, name, price, date, and a CTA button


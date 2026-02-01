
# Fix Instructor Mobile Home Page Logo

## Problem Identified
The `InstructorMobileHome.tsx` component renders its **own header** with text-based branding instead of using the graphical logo. The header at lines 140-143 displays "EVERY DRIVER.CO.UK" as styled text, which is why your logo changes haven't appeared on this page.

The component even defines a logo path on line 49 (`const instructorLogo = "/everydriver-logo-v2.png"`) but never uses it.

## Solution
Replace the text-based branding with the smaller graphical logo (`/everydriver-logo-mobile.png`) using `h-4` sizing to prevent header squashing.

---

## Technical Changes

### File: `src/components/instructor/InstructorMobileHome.tsx`

**Change 1**: Update the logo constant (line 49)
- From: `const instructorLogo = "/everydriver-logo-v2.png";`
- To: `const instructorLogo = "/everydriver-logo-mobile.png";`

**Change 2**: Replace the text branding with image logo (lines 140-143)
- Remove:
  ```tsx
  <div className="flex flex-col">
    <span className="text-primary font-bold text-lg tracking-tight">EVERY DRIVER<span className="text-xs font-normal">.CO.UK</span></span>
    <span className="text-xs text-muted-foreground -mt-1">Supporting Your Journey</span>
  </div>
  ```
- Replace with:
  ```tsx
  <img 
    src={instructorLogo}
    alt="EveryDriver" 
    className="h-4 object-contain"
  />
  ```

---

## Summary
| Item | Before | After |
|------|--------|-------|
| Logo source | Text styling | `/everydriver-logo-mobile.png` |
| Logo size | N/A (text) | `h-4` (16px) |
| Header height | Squashed | Compact |

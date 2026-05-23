## Import pupil from phone contacts

Add an **"Import from contacts"** button to both the Add Pupil form (`AddPupilSheet`) and the Edit Pupil form (`EditPupilSheet`) that pulls **name, phone, email and postcode/address** from the device's contacts.

### How it works per platform

| Platform | Method | Works? |
|---|---|---|
| Capacitor native app (iOS + Android) | `@capacitor-community/contacts` plugin | ✅ Full support |
| Android Chrome (web/PWA) | Browser `navigator.contacts.select()` (Contact Picker API) | ✅ Name, tel, email only — no address |
| iOS Safari (web/PWA) | Not supported by Apple | ❌ Button hidden, manual entry only |
| Desktop browsers | Not supported | ❌ Button hidden |

### UX

- A subtle **"📇 Import from contacts"** ghost button at the top of the form, above the Name field.
- Tap → native contact picker sheet opens (iOS native / Android native / Android Chrome web picker).
- User picks one contact → fields are pre-filled. User can still edit anything before saving.
- On Edit Pupil, importing **overwrites** any pre-filled values (with a small "Replaced from contacts" toast so it's clear).
- If the contact has multiple phones/emails, we take the first one labelled "mobile" or otherwise the first entry.
- Postcode is extracted from the contact's postal address `postalCode` field; if absent, we fall back to running a UK-postcode regex over the address string. If still nothing, we just leave postcode empty.
- Phone numbers are normalised to UK format (07… or +44) using the existing `formatPhoneNumber` helper.
- Button is **hidden entirely** on platforms with no contacts support, so there's no dead UI.

### What gets built

1. **New helper hook `useContactImport()`** (`src/hooks/useContactImport.ts`)
   - Exposes `{ supported: boolean, pickContact: () => Promise<ImportedContact | null> }`
   - Detects: Capacitor native → uses plugin; Android Chrome → uses `navigator.contacts`; else `supported = false`.
   - Returns a normalised `ImportedContact { name, phone, email, address, postcode }`.
   - All values trimmed + length-capped + validated via zod before being returned.

2. **New small component `ImportFromContactsButton.tsx`**
   - Renders nothing when `!supported`.
   - On click, calls `pickContact()`, then invokes an `onImport(contact)` callback.

3. **Edits to `AddPupilSheet.tsx`** — mount the button just above the Name row; merge imported values into `form` state.

4. **Edits to `EditPupilSheet.tsx`** — same button, same merge behaviour, plus a "Replaced from contacts" toast.

5. **Install the Capacitor plugin** `@capacitor-community/contacts` so the native wrapper can read contacts. Add the required iOS `NSContactsUsageDescription` ("Used to import pupil details from your contacts") and Android `READ_CONTACTS` permission via the plugin's standard config.

### Things to be aware of

- For the **iPhone PWA** (Safari, no native wrapper), the button simply won't appear — instructors will need the Capacitor build to import contacts on iOS. Worth flagging in the install/help copy if relevant.
- After the plugin is installed, the user must run `npx cap sync` locally before the next native build will include the contacts capability.
- Mobile layouts on the pupil sheets will gain one new row; per the project rule about not altering mobile layouts unless asked, the user has explicitly asked here so it's in scope.

### Out of scope (can be added later)

- Bulk import (picking multiple contacts at once).
- Two-way sync / writing back to phone contacts.
- Matching incoming calls to existing pupils.

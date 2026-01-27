

# Multi-Slot Selection for Gap Offers

Currently, when you send multiple slots, the pupil can only reply "YES" which books the most recent slot automatically. They have no way to choose a specific slot.

## Proposed Solution: Numbered Selection

Allow pupils to reply with a number to select their preferred slot.

### How It Will Work

**SMS sent to pupil:**
```
Hi Sarah! I have some short notice lesson slots available if you want one:

1. Mon 3 Feb 10:00-12:00
2. Mon 3 Feb 12:00-14:00
3. Tue 4 Feb 12:00-14:00

Reply with the number (1, 2, or 3) to book, or NO to pass! - Ken
```

**Pupil can reply:**
- `1` - Books slot 1
- `2` - Books slot 2
- `YES` or `Y` - Books the first available slot (for simplicity)
- `NO` - Declines all offers

### Changes Required

**1. Update SMS message format** (`send-gap-sms`)
- Add slot numbers (1, 2, 3...) in front of each slot
- Store a `slot_number` field with each gap offer record
- Update the reply instructions to mention numbers

**2. Update webhook response handling** (`twilio-webhook`)
- Detect if reply is a number (1, 2, 3, etc.)
- Find the matching offer by slot number for that pupil
- Book the selected slot
- Mark other pending offers from same batch as "passed"

---

## Technical Details

### Database Change
Add `slot_number` column to `gap_offers` table to track which number corresponds to which offer.

### Edge Function Updates

**send-gap-sms changes:**
- Format slots with numbers: `1. Mon 3 Feb 10:00-12:00`
- Store `slot_number` (1, 2, 3...) when creating offer records
- Update message text: "Reply with the number (1, 2, or 3) to book"

**twilio-webhook changes:**
- Parse numeric replies (e.g., "1", "2", "3")
- Query for offer matching that slot number + phone number
- When one slot is booked, mark sibling offers as "passed"
- Keep existing YES/NO logic as fallback (YES = first slot)

### Example Flow

```text
Instructor sends 3 slots to all pupils
    ↓
Each pupil gets SMS with numbered options
    ↓
Pupil replies "2"
    ↓
Webhook finds offer with slot_number=2 for that phone
    ↓
Books slot 2, marks slots 1 & 3 as "passed"
    ↓
Instructor gets push notification
```


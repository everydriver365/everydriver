## Test Swap step — Drive365 booking flow

Add a new **optional** "Test swap" step to the Drive365 booking summary page, sitting between the Payment block and the existing payment-triggered submit/confirm. The supplied React Native code is translated to React web using existing shadcn primitives. No existing booking step, payment logic, or validation is modified.

### Where it goes

File: `src/pages/everydriver/BookingSummary.tsx`

The current page has inline steps **Your Details → Choose Lessons → Payment**, where Payment also creates the booking and routes to `/booking-confirmation`. The new swap step is rendered as a card directly **above the `CoursePaymentBlock`** (i.e. visible after slots are scheduled, before the user taps a payment method). This is the closest match to "between Payment and Confirm" given the existing architecture.

Both desktop and mobile step indicators in `BookingSummary.tsx` get a 4th step labelled **"Test swap"** with an "Optional" caption underneath. The existing step-number logic stays untouched; the new pip is rendered as `current` once `isPupilDetailsComplete && isFullyScheduled`.

### Component

New file: `src/components/everydriver/TestSwapOptInCard.tsx` — pure presentational, controlled by props.

Translation of the React Native spec:

| RN element | Web equivalent |
|---|---|
| `View` / `ScrollView` | `div` with Tailwind |
| `Text` | `p` / `span` |
| `Switch` | shadcn `Switch` |
| `TextInput` | shadcn `Input` |
| `Picker` | shadcn `Select` |
| `TouchableOpacity` (consent box) | shadcn `Checkbox` inside a clickable `label` |
| `SwapIcon` / `InfoIcon` / `AlertIcon` / `CheckIcon` | lucide `ArrowLeftRight`, `Info`, `AlertTriangle`, `Check` |

Colours from the spec map to inline styles (kept literal so the visual matches):
- Header background `#E6F1FB`, text `#0C447C`, "Optional" pill `#1A52A0`
- Info banner `#E6F1FB` / border `#B5D4F4`
- Toggle / consent container `#F1EFE8`
- Warning banner `#FAEEDA` / border `#FAC775` / text `#854F0B`
- Primary button `#1A52A0`

Spacing matches the spec: 16px outer padding, 14px section gap, 10px field gap, 12px inner padding.

The "Continue to confirmation" / "Skip this step" footer is **not** rendered as a separate footer — instead the existing payment buttons in `CoursePaymentBlock` act as the continue action, and a small "Skip — I don't have a test booked" link sits at the bottom of the card to clear `swapOptIn` and collapse the form. This keeps the existing payment UX as the single forward action.

### State (added to `BookingSummary.tsx`)

```ts
const [swapOptIn, setSwapOptIn]       = useState(false)
const [swapTestDate, setSwapTestDate] = useState('')
const [swapTestTime, setSwapTestTime] = useState('')
const [swapTestCentre, setSwapTestCentre] = useState('')
const [swapPreference, setSwapPreference] = useState<'earlier'|'later'|'any'>('earlier')
const [swapConsent, setSwapConsent]   = useState(false)
```

Pre-population: if the existing `pupils` row already loaded for the learner contains test data (`practical_test_date`, `practical_test_time`, `practical_test_centre`), seed those three fields once on mount. **No new API call** is added.

### Persistence

A new table is created (separate from the existing instructor-side `test_swap_offers`):

```sql
create table public.booking_test_swap_optins (
  id uuid primary key default gen_random_uuid(),
  pupil_id uuid not null references public.pupils(id) on delete cascade,
  instructor_id uuid not null references public.instructors(id) on delete cascade,
  test_date text,         -- free-text, learner-entered
  test_time text,
  test_centre text,
  preference text not null check (preference in ('earlier','later','any')),
  consent_given boolean not null,
  consent_timestamp timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.booking_test_swap_optins enable row level security;
```

RLS:
- Pupils can insert a row for themselves (matched via `pupil_id` belonging to the authenticated learner — using existing pupil-auth pattern).
- Instructors can read rows for their own pupils via `get_instructor_id_for_user(auth.uid())`.
- Admins full access via `has_role(auth.uid(), 'admin')`.

The insert is fired from `ensureBookingCreated`'s success path (the same place the booking pupil id becomes known) **only when `swapOptIn === true && swapConsent === true`**. Skipped or un-consented = no row written. `consent_timestamp` is captured at the moment the consent checkbox is ticked and stored in state, then sent with the insert.

### Hard-constraint compliance

- Existing steps (Details / Choose Lessons / Payment) are untouched — only a new card is added before payment and a new pip on the indicators.
- Skipping is always possible: the payment buttons remain enabled regardless of swap state when `swapOptIn === false`.
- When `swapOptIn === true && swapConsent === false`, all payment buttons in `CoursePaymentBlock` are disabled via a new `disabledReason="Tick the swap consent box or turn off the swap toggle"` prop forwarded into `CoursePaymentBlock` (additive prop — existing behaviour preserved when not set).
- Consent checkbox starts `false` and is never auto-ticked.
- No swap data is written if the learner doesn't opt in.
- `consent_timestamp` recorded as ISO 8601 `new Date().toISOString()` at the moment of ticking.
- No new libraries — Switch, Input, Select, Checkbox already exist in shadcn.
- Indicators show "Optional" caption under the swap pip.

### Files

**Create**
- `src/components/everydriver/TestSwapOptInCard.tsx` — the new card component
- Migration: create `booking_test_swap_optins` + RLS

**Edit**
- `src/pages/everydriver/BookingSummary.tsx`
  - add the 6 state hooks
  - render `<TestSwapOptInCard …/>` above `CoursePaymentBlock`
  - add 4th pip ("Test swap" + "Optional") to the desktop and mobile step indicators
  - in the booking-creation success paths, write to `booking_test_swap_optins` when opted-in + consented
  - pass `disabledReason` to `CoursePaymentBlock` when consent is required but missing
- `src/components/courses/CoursePaymentBlock.tsx` — accept optional `disabledReason?: string`; when set, all payment buttons render disabled with a tooltip showing the reason. Existing callers unaffected.

### Out of scope

- No matching/notification logic for the swap network (that's the existing instructor-side `test_swap_offers` flow).
- Mobile native screens are not touched (per project memory).
- No changes to `BookingConfirmation.tsx`.

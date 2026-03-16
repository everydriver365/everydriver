# EveryDriver — Instructor Mobile App (Rork Max Build Prompt)

> **Purpose**: Build a native React Native (Expo) instructor app for UK driving instructors. Authentication is **deferred** — the app uses hardcoded demo data so all screens can be built and tested immediately. Supabase connection details are included for when live data is wired in later.

---

## 1. PROJECT SETUP

### Tech Stack
- **Framework**: Expo (React Native) with TypeScript
- **Navigation**: `expo-router` (file-based routing) or `@react-navigation/native`
- **State**: React Context + hooks
- **Storage**: `@react-native-async-storage/async-storage`
- **Maps**: `react-native-maps` (Google Maps provider)
- **Charts**: `victory-native` or `react-native-chart-kit`
- **Bottom Sheets**: `@gorhom/bottom-sheet`
- **Animations**: `react-native-reanimated`
- **Haptics**: `expo-haptics`
- **Icons**: `lucide-react-native` or `@expo/vector-icons`

### Supabase (Connect Later — Phase 2)
```
SUPABASE_URL: https://qyqeibovdhyohkfagujv.supabase.co
SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5cWVpYm92ZGh5b2hrZmFndWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMTcyNjQsImV4cCI6MjA4Mjc5MzI2NH0.K2yV-2P603x7xVBhBpUrbjVzwz3L0nD3pMhz8qkeT0o
```
Edge Functions Base URL: `https://qyqeibovdhyohkfagujv.supabase.co/functions/v1/{function-name}`

> **For now**: All data comes from the `DemoDataProvider` context below. When auth is added later, swap demo data for Supabase queries filtered by `instructor_id`.

---

## 2. DEMO DATA PROVIDER (No Auth Required)

Create a `DemoDataContext` that wraps the entire app and provides all mock data. Every screen reads from this context instead of making API calls.

### Demo Instructor Profile
```typescript
export const demoInstructor = {
  id: "demo-instructor-001",
  name: "Sarah Mitchell",
  email: "sarah@drivewithsarah.co.uk",
  phone: "07700 900123",
  postcode: "SW1A 1AA",
  adi_number: "123456",
  badge_number: "ADI-789012",
  transmission_type: "manual",
  hourly_rate: 38,
  profile_image_url: null,
  wallpaper_color: "#2563eb",
  license_expiry: "2027-06-15",
  commission_payer: "instructor",
  created_at: "2023-01-15T00:00:00Z",
};
```

### Demo Pupils (8 pupils)
```typescript
export const demoPupils = [
  {
    id: "pupil-001",
    name: "James Wilson",
    phone: "07700 900201",
    email: "james.w@email.com",
    address: "14 Maple Drive, London",
    postcode: "SW11 3AB",
    course_status: "active",
    account_balance: -76, // owes £76
    lesson_rate: 38,
    total_lessons: 24,
    transmission_preference: "manual",
    test_date: "2026-04-22",
    dob: "2004-03-15",
  },
  {
    id: "pupil-002",
    name: "Emma Thompson",
    phone: "07700 900202",
    email: "emma.t@email.com",
    address: "8 Oak Lane, London",
    postcode: "SE15 2QN",
    course_status: "active",
    account_balance: 0,
    lesson_rate: 38,
    total_lessons: 18,
    transmission_preference: "manual",
    test_date: null,
    dob: "2005-07-22",
  },
  {
    id: "pupil-003",
    name: "Amir Khan",
    phone: "07700 900203",
    email: "amir.k@email.com",
    address: "22 Birch Road, London",
    postcode: "E14 9TT",
    course_status: "active",
    account_balance: 38, // credit
    lesson_rate: 40,
    total_lessons: 31,
    transmission_preference: "manual",
    test_date: "2026-03-28",
    dob: "2003-11-08",
  },
  {
    id: "pupil-004",
    name: "Sophie Chen",
    phone: "07700 900204",
    email: "sophie.c@email.com",
    address: "5 Elm Street, London",
    postcode: "N1 7GU",
    course_status: "active",
    account_balance: -114,
    lesson_rate: 38,
    total_lessons: 12,
    transmission_preference: "automatic",
    test_date: null,
    dob: "2006-01-30",
  },
  {
    id: "pupil-005",
    name: "Ryan O'Brien",
    phone: "07700 900205",
    email: "ryan.ob@email.com",
    address: "91 Cedar Avenue, London",
    postcode: "SW4 6LH",
    course_status: "passed",
    account_balance: 0,
    lesson_rate: 38,
    total_lessons: 36,
    transmission_preference: "manual",
    test_date: null,
    dob: "2002-09-14",
  },
  {
    id: "pupil-006",
    name: "Fatima Al-Rashid",
    phone: "07700 900206",
    email: "fatima.ar@email.com",
    address: "17 Pine Close, London",
    postcode: "SE22 0PL",
    course_status: "active",
    account_balance: -38,
    lesson_rate: 38,
    total_lessons: 8,
    transmission_preference: "manual",
    test_date: null,
    dob: "2005-04-17",
  },
  {
    id: "pupil-007",
    name: "Tom Bradley",
    phone: "07700 900207",
    email: "tom.b@email.com",
    address: "33 Ash Grove, London",
    postcode: "W12 8QT",
    course_status: "on_hold",
    account_balance: 0,
    lesson_rate: 38,
    total_lessons: 15,
    transmission_preference: "manual",
    test_date: null,
    dob: "2004-12-01",
  },
  {
    id: "pupil-008",
    name: "Priya Sharma",
    phone: "07700 900208",
    email: "priya.s@email.com",
    address: "7 Willow Way, London",
    postcode: "E3 4NA",
    course_status: "active",
    account_balance: -152,
    lesson_rate: 40,
    total_lessons: 20,
    transmission_preference: "manual",
    test_date: "2026-05-10",
    dob: "2003-06-25",
  },
];
```

### Demo Lessons (Today + This Week)
```typescript
// Use dynamic dates relative to today
const today = new Date().toISOString().split("T")[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

export const demoLessons = [
  {
    id: "lesson-001",
    pupil_id: "pupil-001",
    pupil_name: "James Wilson",
    lesson_date: today,
    start_time: "09:00",
    end_time: "11:00",
    duration_hours: 2,
    lesson_type: "Standard",
    status: "confirmed",
    pickup_address: "14 Maple Drive, SW11 3AB",
    dropoff_address: "14 Maple Drive, SW11 3AB",
    payment_status: "unpaid",
    notes: "Focus on roundabouts and lane discipline",
  },
  {
    id: "lesson-002",
    pupil_id: "pupil-003",
    pupil_name: "Amir Khan",
    lesson_date: today,
    start_time: "11:30",
    end_time: "13:30",
    duration_hours: 2,
    lesson_type: "Mock Test",
    status: "confirmed",
    pickup_address: "22 Birch Road, E14 9TT",
    dropoff_address: "Goodmayes Test Centre",
    payment_status: "paid",
    notes: "Full mock test — independent driving section",
  },
  {
    id: "lesson-003",
    pupil_id: "pupil-006",
    pupil_name: "Fatima Al-Rashid",
    lesson_date: today,
    start_time: "14:00",
    end_time: "16:00",
    duration_hours: 2,
    lesson_type: "Standard",
    status: "confirmed",
    pickup_address: "17 Pine Close, SE22 0PL",
    dropoff_address: "17 Pine Close, SE22 0PL",
    payment_status: "unpaid",
    notes: "Dual carriageway introduction",
  },
  {
    id: "lesson-004",
    pupil_id: "pupil-002",
    pupil_name: "Emma Thompson",
    lesson_date: tomorrow,
    start_time: "09:00",
    end_time: "11:00",
    duration_hours: 2,
    lesson_type: "Standard",
    status: "confirmed",
    pickup_address: "8 Oak Lane, SE15 2QN",
    dropoff_address: "8 Oak Lane, SE15 2QN",
    payment_status: "paid",
    notes: "Parallel parking and bay parking",
  },
  {
    id: "lesson-005",
    pupil_id: "pupil-008",
    pupil_name: "Priya Sharma",
    lesson_date: tomorrow,
    start_time: "12:00",
    end_time: "14:00",
    duration_hours: 2,
    lesson_type: "Standard",
    status: "confirmed",
    pickup_address: "7 Willow Way, E3 4NA",
    dropoff_address: "7 Willow Way, E3 4NA",
    payment_status: "unpaid",
    notes: "Night driving preparation",
  },
  {
    id: "lesson-006",
    pupil_id: "pupil-004",
    pupil_name: "Sophie Chen",
    lesson_date: tomorrow,
    start_time: "15:00",
    end_time: "17:00",
    duration_hours: 2,
    lesson_type: "Assessment",
    status: "confirmed",
    pickup_address: "5 Elm Street, N1 7GU",
    dropoff_address: "5 Elm Street, N1 7GU",
    payment_status: "paid",
    notes: "Initial assessment — first lesson",
  },
];
```

### Demo Payment History
```typescript
export const demoPayments = [
  { id: "pay-001", pupil_id: "pupil-001", pupil_name: "James Wilson", amount: 76, payment_method: "Cash", created_at: "2026-03-14T10:30:00Z", notes: "2hr lesson" },
  { id: "pay-002", pupil_id: "pupil-003", pupil_name: "Amir Khan", amount: 120, payment_method: "Bank Transfer", created_at: "2026-03-13T18:00:00Z", notes: "3hr block payment" },
  { id: "pay-003", pupil_id: "pupil-002", pupil_name: "Emma Thompson", amount: 76, payment_method: "Square", created_at: "2026-03-12T11:00:00Z", notes: "2hr lesson" },
  { id: "pay-004", pupil_id: "pupil-008", pupil_name: "Priya Sharma", amount: 80, payment_method: "Cash", created_at: "2026-03-11T16:00:00Z", notes: "2hr lesson" },
  { id: "pay-005", pupil_id: "pupil-006", pupil_name: "Fatima Al-Rashid", amount: 38, payment_method: "Bank Transfer", created_at: "2026-03-10T09:00:00Z", notes: "1hr lesson" },
  { id: "pay-006", pupil_id: "pupil-004", pupil_name: "Sophie Chen", amount: 76, payment_method: "Klarna", created_at: "2026-03-09T14:00:00Z", notes: "2hr lesson" },
];
```

### Demo Stats
```typescript
export const demoStats = {
  todayLessons: 3,
  todayEarnings: 228, // 3 × 2hrs × £38
  weeklyHours: 28,
  weeklyEarnings: 1064,
  monthlyEarnings: 4256,
  passRate: 78,
  activePupils: 6,
  totalPupils: 8,
  passedPupils: 1,
  onHoldPupils: 1,
  outstandingBalance: 380,
};
```

### Demo Expenses
```typescript
export const demoExpenses = [
  { id: "exp-001", category: "Fuel", amount: 65.40, date: "2026-03-14", vendor: "Shell", notes: "Full tank" },
  { id: "exp-002", category: "Insurance", amount: 125.00, date: "2026-03-01", vendor: "Collingwood", notes: "Monthly premium", is_recurring: true },
  { id: "exp-003", category: "Car Wash", amount: 12.00, date: "2026-03-13", vendor: "Sparkle Clean", notes: null },
  { id: "exp-004", category: "Dual Controls", amount: 45.00, date: "2026-03-05", vendor: "He-Man", notes: "Annual service" },
];
```

### DemoDataProvider Context
```typescript
// contexts/DemoDataContext.tsx
import React, { createContext, useContext, useState } from "react";

interface DemoDataContextType {
  instructor: typeof demoInstructor;
  pupils: typeof demoPupils;
  lessons: typeof demoLessons;
  payments: typeof demoPayments;
  expenses: typeof demoExpenses;
  stats: typeof demoStats;
  // Mutators for local state changes
  addLesson: (lesson: any) => void;
  addPayment: (payment: any) => void;
  updatePupil: (id: string, updates: any) => void;
}

const DemoDataContext = createContext<DemoDataContextType>(null!);

export function DemoDataProvider({ children }: { children: React.ReactNode }) {
  const [pupils, setPupils] = useState(demoPupils);
  const [lessons, setLessons] = useState(demoLessons);
  const [payments, setPayments] = useState(demoPayments);
  const [expenses, setExpenses] = useState(demoExpenses);

  const addLesson = (lesson: any) => setLessons(prev => [...prev, { id: `lesson-${Date.now()}`, ...lesson }]);
  const addPayment = (payment: any) => setPayments(prev => [{ id: `pay-${Date.now()}`, created_at: new Date().toISOString(), ...payment }, ...prev]);
  const updatePupil = (id: string, updates: any) => setPupils(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

  return (
    <DemoDataContext.Provider value={{
      instructor: demoInstructor,
      pupils,
      lessons,
      payments,
      expenses,
      stats: demoStats,
      addLesson,
      addPayment,
      updatePupil,
    }}>
      {children}
    </DemoDataContext.Provider>
  );
}

export const useDemoData = () => useContext(DemoDataContext);
```

---

## 3. NAVIGATION STRUCTURE

### Bottom Tab Bar (6 tabs)
```
┌──────┬──────────┬───────┬───────┬────────┬──────┐
│ Home │ Schedule │ Track │ Money │ Pupils │ More │
└──────┴──────────┴───────┴───────┴────────┴──────┘
```

| Tab | Icon | Primary Screen |
|-----|------|---------------|
| Home | `Home` | Dashboard with stats, next lesson, today's schedule |
| Schedule | `Calendar` | Day/week/month calendar view |
| Track | `MapPin` | Live GPS map + trip history |
| Money | `PoundSterling` (£) | Earnings dashboard |
| Pupils | `Users` | Pupil list with search/filter |
| More | `Grid3x3` | Feature grid menu |

### Tab Bar Styling
- Height: 60px + safe area bottom inset
- Background: frosted glass (blur effect)
- Active tab: filled icon + label in primary blue
- Inactive: outline icon + muted label
- Haptic feedback on tab press (`expo-haptics`)

### App Entry Point
```typescript
// App.tsx — No auth check, straight to tabs
export default function App() {
  return (
    <DemoDataProvider>
      <NavigationContainer>
        <BottomTabs />
      </NavigationContainer>
    </DemoDataProvider>
  );
}
```

---

## 4. COMPLETE SCREEN INVENTORY

### 4.1 HOME TAB — Dashboard

**Layout**: Scrollable dashboard with hero stats and card tiles

#### Header Bar
- Frosted glass background with blur
- Left: Avatar circle (initials "SM") + greeting ("Good morning, Sarah")
- Right: SOS button (red circle, "SOS" text), Notification bell (with badge count = 3), Settings gear icon, "£ Pay" button (opens Take Payment sheet)
- Safe area: Solid primary color fill above header for status bar

#### Hero Stats Section
- Horizontal scrollable row of 4 frosted glass cards:
  - **Today**: "3 lessons" with calendar icon
  - **Earned Today**: "£228" with pound icon
  - **This Week**: "28 hrs" with clock icon
  - **Pass Rate**: "78%" with trophy icon
- Cards have subtle gradient backgrounds

#### Next Lesson Card (promoted when lesson within 2 hours)
- Large card with:
  - Pupil name + avatar
  - Time ("09:00 – 11:00")
  - Pickup address
  - Lesson type badge ("Standard")
  - Payment status badge ("Unpaid" in amber, "Paid" in green)
- Action buttons row: "Prep" (opens pupil details), "I'm Here" (marks arrival), "Running Late" (opens sheet)
- "Record Route" toggle button

#### Today's Schedule
- Vertical timeline with time markers on left
- Lesson cards showing: time, pupil name, lesson type, duration
- Gaps between lessons shown as empty slots
- Tap a lesson to expand details

#### Quick Actions FAB
- Floating action button (bottom right, above tab bar)
- Opens a 4-column grid popover:
  - Add Lesson, Take Payment, Record Test, Message Pupil
  - Start Tracking, Quick Availability, Gap Filler, Find My Car
- Each action has an icon and label
- Haptic feedback on open + selection

#### Dashboard Tiles (scrollable cards below schedule)
- **Outstanding Tasks**: Count of pending items (unpaid lessons, unsigned T&Cs)
- **Tomorrow Preview**: "2 lessons, first at 09:00" with pupil names
- **Pupils Owing Money**: List of pupils with negative balances
- **Weekly Goal Ring**: Circular progress ring (28/35 hours target)
- **Teaching Streak**: "🔥 12 days" streak badge

### 4.2 SCHEDULE TAB

**Layout**: Calendar with day/week/month toggle

#### Calendar Header
- Month/year title
- View toggle: Day | Week | Month (iOS segmented control style)
- Add lesson button (+ icon)

#### Day View (Default)
- Full-height vertical timeline (07:00–20:00)
- Lesson blocks color-coded by type:
  - Standard: Primary blue
  - Mock Test: Amber
  - Test Day: Red
  - Assessment: Purple
  - Motorway: Green
- Each block shows: pupil name, time, pickup location
- Tap block → expand to show full details + quick actions

#### Week View
- 7-column grid with hour rows
- Compact lesson blocks
- Today column highlighted

#### Month View
- Standard calendar grid
- Day cells show lesson count dots
- Tap day → switches to Day View for that date

#### Add Lesson Bottom Sheet
- Pupil picker (searchable list from demo data)
- Date picker (native)
- Start time / end time pickers
- Duration shortcuts: 1hr, 1.5hr, 2hr buttons
- Lesson type selector: Standard, Mock Test, Test Day, Assessment, Motorway
- Pickup address (text input)
- Dropoff address (text input, defaults to pickup)
- Notes text area
- Save button → adds to `demoLessons` via context

### 4.3 TRACK TAB

**Sub-navigation**: Segmented control — Live Map | Trips | Routes

#### Live Map
- Full-screen `react-native-maps` (Google Maps provider)
- Demo: Show a static marker at instructor's postcode location (SW1A 1AA → 51.5007, -0.1246)
- Speed badge overlay (shows "0 mph" when not tracking)
- Start/Stop tracking toggle button (demo: toggles state locally)
- Pupil selector dropdown for active session
- When "tracking": Show a pulsing dot on map + session timer

#### Trips
- List of recent trips (demo: generate 5 mock trip summaries)
- Each trip card shows:
  - Date + time
  - Duration (e.g., "1h 42m")
  - Distance (e.g., "23.4 miles")
  - Max speed
  - Pupil name (if linked to lesson)
- Tap → Trip Detail Sheet:
  - Route polyline on map
  - Speed chart (speed vs time line graph)
  - Stats summary: avg speed, max speed, distance, idle time

#### Routes
- Saved teaching routes list (demo: 3 mock routes)
  - "Test Centre Route — Goodmayes" (12.3 miles)
  - "Motorway Introduction — M25" (18.7 miles)
  - "Town Centre Practice" (6.2 miles)
- Tap → route preview on map

### 4.4 MONEY TAB

**Layout**: Finance dashboard

#### Hero Card
- Large gradient card showing total monthly earnings
- "£4,256 this month" with trend arrow
- Subtitle: "£1,064 this week"

#### Quick Stats Row
- 4 compact cards: Today (£228), This Week (£1,064), Outstanding (£380), Expenses (£247)

#### Action Buttons Grid
- Take Payment, Record Expense, View Reports
- Each button has icon + label

#### Earnings Chart
- Bar chart showing daily earnings for current week
- Using `victory-native` or `react-native-chart-kit`
- Labels: Mon–Sun, values in £

#### Recent Payments List
- Scrollable list from `demoPayments`
- Each row: pupil name, amount (£), method icon, date
- Method icons: 💷 Cash, 🏦 Bank Transfer, 💳 Square, etc.

#### Pupils Owing Money
- Filtered list of pupils with negative `account_balance`
- Shows: name, amount owed, "Send Reminder" button
- Tap pupil → opens their profile

#### Take Payment Bottom Sheet
- Pupil picker
- Amount input (£) with quick-fill buttons (lesson rate × 1, 2, 3)
- Payment method selector: Cash, Bank Transfer, Square, Klarna, Clearpay
- Notes input
- "Record Payment" button → updates local state

#### Record Expense Bottom Sheet
- Category picker: Fuel, Insurance, Maintenance, Car Wash, Dual Controls, Training, Other
- Amount input (£)
- Vendor name
- Date picker
- Receipt camera button (demo: placeholder)
- Notes
- Save → adds to expenses list

### 4.5 PUPILS TAB

**Layout**: iOS-style searchable list

#### Header
- Large title: "Pupils" (iOS-style scroll-responsive)
- Search bar (animated, iOS-style)
- Filter pills: All (8), Active (6), Passed (1), On Hold (1)

#### Stats Strip
- 4 columns: Active 6 | Passed 1 | Lessons 164 | On Hold 1

#### Pupil Cards
- List of pupil cards from `demoPupils`
- Each card shows:
  - Avatar (initials circle, colored by status)
  - Name
  - Course status badge (Active = green, Passed = blue, On Hold = amber)
  - Balance (red if negative, green if positive)
  - Test date countdown (if set): "Test in 37 days"
  - Lesson count
- Tap card → opens full-screen pupil profile sheet

#### Pupil Profile (Full-Screen Bottom Sheet — 95% height)
Tabs: Overview | Lessons | Payments | Notes

##### Overview Tab
- Hero section: Dark gradient with pupil name, avatar, status badge
- 4-column stats: Lessons, Hours, Balance, Test Date
- Contact info: phone (tap to call), email (tap to email), address
- Emergency contact section
- **Syllabus Progress**: 27 DVSA competencies grouped by category:
  - **Cockpit Checks**: Cockpit drill, Safety checks
  - **Moving Off & Stopping**: Moving off safely, Stopping normally, Moving off at an angle, Moving off uphill/downhill
  - **Mirror Use**: Use of mirrors — rear, Use of mirrors — signal, Use of mirrors — change direction/speed
  - **Signals**: Giving signals, Timing of signals
  - **Junctions**: Approach speed, Observation, Turning left, Turning right, Cutting corners, Emerging
  - **Roundabouts**: Approach, Signs/markings, Lane discipline, Turning
  - **Dual Carriageways**: Join safely, Lane discipline, Leave safely
  - **Pedestrian Crossings**: Recognition, Speed on approach
  - **Independent Driving**: Following road signs, Sat nav
  - **Manoeuvres**: Parallel park, Bay park (forward), Bay park (reverse), Pull up on right
  - **Emergency Stop**: Prompt response, Controlled stop
  - Each competency has 5 levels: Introduced → Under Guidance → Prompted → Seldom Prompted → Independent
  - Color-coded progress bars per competency
  - Category headers with "Set all" bulk toggle
- Test date countdown card (gradient banner)

##### Lessons Tab
- Chronological list of lessons for this pupil
- Each entry: date, time, duration, type, notes preview
- Filter by lesson type

##### Payments Tab
- Account balance display (large, colored)
- Payment history for this pupil
- "Record Payment" button → opens Take Payment sheet pre-filled

##### Notes Tab
- Chronological notes list
- Add note button → text input + save
- Each note shows: date, content, option to edit/delete

#### Add Pupil Flow
- Multi-step form:
  1. Name, phone, email
  2. Address, postcode
  3. DOB, license number (optional)
  4. Transmission preference, lesson rate
  5. Emergency contact (name, phone, relationship)
- Save → adds to `demoPupils` via context

### 4.6 MORE TAB — Feature Menu

**Layout**: Grid of feature tiles (3 columns)

Each tile: Icon + Label. Tap → navigates to feature screen.

#### Communication
| Tile | Screen |
|------|--------|
| Messages | Inbox — list of pupil conversations, tap to open chat |
| Notifications | Notification feed (demo: 5 mock notifications) |
| Broadcast | Send message to multiple/all pupils |

#### Driving Tests
| Tile | Screen |
|------|--------|
| Test Results | Record test result — pupil picker, pass/fail, fault marking (DL25A format) |
| Standards Check | DVSA trigger metrics — minor faults, serious faults, physical action rate |

#### Business Tools
| Tile | Screen |
|------|--------|
| Pipeline | Kanban board — New, Contacted, Qualified, Won, Lost columns with lead cards |
| Gaps | Find schedule gaps — list of open slots with "Offer to pupil" option |
| Jobs | Pending job offers (demo: 2 mock job cards) |
| Referrals | Referral code + referral history |

#### Planning
| Tile | Screen |
|------|--------|
| Todos | Simple task list with checkboxes |
| Notes | Personal notes list |
| Availability | Weekly working hours grid (Mon–Sun, start/end times) |

#### Vehicle & Fleet
| Tile | Screen |
|------|--------|
| Vehicle Health | Vehicle card with MOT date, insurance expiry, tax date, mileage |
| Fuel Log | Fuel purchase list + add entry |
| Mileage | Mileage log with business/personal toggle |
| Find My Car | Map showing last known vehicle position |

#### Money (Extended)
| Tile | Screen |
|------|--------|
| Expenses | Full expense tracker (list + add) |
| Tax Report | Annual summary — income, expenses, mileage allowance, estimated tax |
| Month End | Monthly review — earnings summary, adjustments, export options |
| Invoices | Invoice list + generate for pupil |

#### Health & Wellness
| Tile | Screen |
|------|--------|
| Blood Pressure | Log BP readings — systolic/diastolic, classification (Normal/Elevated/High) |
| Weight | Log weight — kg/lbs/stones, BMI calculation |
| Hydration | Daily water intake tracker (glass icons) |
| Break Reminders | Smart break suggestions based on schedule gaps |

#### Settings
| Tile | Screen |
|------|--------|
| Settings | Profile, business details, theme, notification preferences |
| Appearance | Dark mode toggle, accent color picker |

---

## 5. EDGE FUNCTIONS REFERENCE (Wire Later)

> These edge functions exist on the backend. For now, mock their responses. When Supabase auth is added, call them with `Authorization: Bearer {session.access_token}`.

### AI / Content Generation
| Function | Purpose | Mock Response |
|----------|---------|---------------|
| `generate-morning-briefing` | Daily briefing | Return a hardcoded 3-sentence summary |
| `generate-weekly-report` | Weekly report | Return mock stats paragraph |
| `generate-nudges` | Smart nudges | Return 3 mock suggestion strings |
| `generate-quick-replies` | Chat quick replies | Return 3 reply options |
| `extract-invoice-data` | Receipt OCR | Return mock extracted data |

### Communication
| Function | Purpose |
|----------|---------|
| `send-push-notification` | Push notifications |
| `send-payment-reminder` | Payment reminders |
| `send-lesson-reminders` | Lesson reminders |
| `send-gap-sms` | Gap offer SMS |

### Payments
| Function | Purpose |
|----------|---------|
| `square-checkout` | Square payment |
| `klarna-session` | Klarna session |
| `clearpay-checkout` | Clearpay checkout |
| `pupil-payment-checkout` | Pupil self-pay |

### GPS & Location
| Function | Purpose |
|----------|---------|
| `snap-to-road` | Road snapping |
| `geocode-postcode` | Postcode → lat/lng |
| `get-fuel-prices` | Nearby fuel prices |
| `convert-to-what3words` | GPS → what3words |

### Documents
| Function | Purpose |
|----------|---------|
| `generate-pdf` | PDF report generation |

---

## 6. DATABASE TABLES (Reference for Phase 2)

> When auth is added, these are the key tables. All have RLS policies requiring `instructor_id` match.

### Core
| Table | Key Fields |
|-------|------------|
| `instructors` | `auth_user_id`, `name`, `phone`, `email`, `postcode`, `hourly_rate`, `transmission_type`, `adi_number` |
| `pupils` | `instructor_id`, `name`, `phone`, `email`, `address`, `postcode`, `account_balance`, `course_status`, `lesson_rate` |
| `scheduled_lessons` | `instructor_id`, `pupil_id`, `lesson_date`, `start_time`, `end_time`, `duration_hours`, `lesson_type`, `status`, `payment_status` |
| `payment_history` | `pupil_id`, `instructor_id`, `amount`, `payment_method`, `notes` |

### Progress
| Table | Purpose |
|-------|---------|
| `pupil_competency_levels` | 27 DVSA competencies per pupil |
| `lesson_syllabus_updates` | Skill change audit trail |

### Vehicle & Telematics
| Table | Purpose |
|-------|---------|
| `instructor_vehicles` | Vehicle fleet |
| `gps_devices` | GPS trackers |
| `lesson_telematics` | Tracking sessions |
| `lesson_routes` | Recorded routes |

### Financial
| Table | Purpose |
|-------|---------|
| `instructor_expenses` | Business expenses |
| `fuel_log` | Fuel purchases |
| `mileage_logs` | Mileage records |

### Communication
| Table | Purpose |
|-------|---------|
| `conversations` | Chat threads (realtime enabled) |
| `messages` | Chat messages (realtime enabled) |

### Settings
| Table | Purpose |
|-------|---------|
| `instructor_settings` | General settings |
| `instructor_working_hours` | Availability schedule |

---

## 7. DESIGN SYSTEM

### Color Palette (HSL)
```
Primary:            hsl(221, 83%, 53%)  — Royal Blue (#2563eb)
Primary Foreground: hsl(210, 40%, 98%)  — Near White
Background:         hsl(0, 0%, 100%)    — White
Foreground:         hsl(222, 84%, 5%)   — Near Black
Muted:              hsl(210, 40%, 96%)  — Light Gray
Accent:             hsl(210, 40%, 96%)  — Light Gray
Destructive:        hsl(0, 84%, 60%)    — Red
Card:               hsl(0, 0%, 100%)    — White
Border:             hsl(214, 32%, 91%)  — Light Border
Success:            hsl(142, 76%, 36%)  — Green (#16a34a)
Warning:            hsl(38, 92%, 50%)   — Amber (#f59e0b)
```

### Dark Mode
```
Background:  hsl(222, 84%, 5%)
Foreground:  hsl(210, 40%, 98%)
Card:        hsl(222, 84%, 10%)
Muted:       hsl(217, 33%, 17%)
Border:      hsl(217, 33%, 17%)
```

### Typography
- **Headers**: System font (SF Pro on iOS, Roboto on Android)
- **Body**: System font, 16px base
- **Monospace**: SF Mono / Roboto Mono (timers, stats, money)
- **Large Title**: 34px bold (iOS-style scroll headers)
- **Section Header**: 20px semibold
- **Card Title**: 17px semibold
- **Body**: 16px regular
- **Caption**: 13px regular, muted color

### Component Patterns

#### Cards
- Border radius: 20px
- Shadow: multi-layer (subtle)
- Frosted glass effect where appropriate (blur + semi-transparent bg)
- Padding: 16px

#### Bottom Sheets
- Use `@gorhom/bottom-sheet`
- Handle bar at top (4px × 36px, rounded, muted color)
- Default snap points: 50%, 95%
- Backdrop: semi-transparent black

#### Buttons
- Primary: Filled primary blue, white text, 12px radius
- Secondary: Outlined, primary border
- Destructive: Red filled
- Ghost: No background, primary text
- All buttons: 48px minimum touch target

#### Lists
- iOS-style grouped lists with section headers
- Chevron disclosure indicator on navigable rows
- Swipe actions where appropriate (delete, archive)
- Pull-to-refresh on all list screens

#### Status Badges
- Pill-shaped, 6px vertical padding, 12px horizontal
- Active: green bg, white text
- Passed: blue bg, white text
- On Hold: amber bg, dark text
- Unpaid: red bg, white text
- Paid: green bg, white text

#### Animations
- Page transitions: shared element where possible
- Card press: scale down to 0.97 on press
- Tab switch: cross-fade
- List items: staggered fade-in on load
- Use `react-native-reanimated` for all animations

### Layout Patterns
- Safe area: `react-native-safe-area-context` everywhere
- Tab bar: 60px + bottom safe area
- Header: 56px + top safe area
- Pull-to-refresh on scrollable screens
- Skeleton loading states on initial render

---

## 8. NATIVE-SPECIFIC ADAPTATIONS

### Web → Native Mapping
| Web Technology | Native Replacement |
|---|---|
| `localStorage` | `@react-native-async-storage/async-storage` |
| `navigator.geolocation` | `expo-location` |
| Web Push | `expo-notifications` |
| `window.open()` | `expo-web-browser` or `Linking.openURL()` |
| `navigator.vibrate()` | `expo-haptics` |
| Screen Wake Lock | `expo-keep-awake` |
| File downloads | `expo-file-system` + `expo-sharing` |
| Camera/Gallery | `expo-image-picker` |
| CSS animations | `react-native-reanimated` |
| Leaflet maps | `react-native-maps` |
| Recharts | `victory-native` |
| Bottom drawers | `@gorhom/bottom-sheet` |
| Framer Motion | `react-native-reanimated` |

### Haptic Feedback
Use `expo-haptics` for:
- Tab bar taps: `Haptics.selectionAsync()`
- Button presses: `Haptics.impactAsync(ImpactFeedbackStyle.Light)`
- Success actions: `Haptics.notificationAsync(NotificationFeedbackType.Success)`
- Destructive actions: `Haptics.notificationAsync(NotificationFeedbackType.Warning)`

### Offline Support (Phase 2)
- Cache lesson data, pupil list, schedule using AsyncStorage
- Queue mutations when offline, sync when reconnected
- GPS recording works offline (store points locally, batch upload)

---

## 9. CRITICAL BUSINESS RULES

1. **Currency**: Always **£ GBP** — never show $ or €. Use `£` prefix, no currency code.
2. **Time format**: 24-hour (e.g., "14:30" not "2:30 PM")
3. **Date format**: DD/MM/YYYY (UK format, e.g., "16/03/2026")
4. **Distance**: Display in **miles** (store km internally)
5. **Speed**: Display in **mph** (store km/h internally)
6. **Lesson types**: Standard, Mock Test, Test Day, Assessment, Motorway, Refresher, Pass Plus, Extended Test, Intensive
7. **Payment methods**: Cash, Bank Transfer, Square, Klarna, Clearpay, GoCardless, Elavon
8. **Competency levels** (in order): Introduced → Under Guidance → Prompted → Seldom Prompted → Independent
9. **Course statuses**: active, passed, on_hold, inactive, cancelled
10. **Multi-tenant**: When Supabase is connected, every query MUST filter by `instructor_id`
11. **Balance convention**: Negative = pupil owes money, Positive = pupil has credit
12. **Soft delete**: Never hard-delete pupil or lesson records

---

## 10. BUILD ORDER

Build screens in this order — each step is self-contained with demo data:

1. **Navigation Shell** — Tab bar + stack navigators for each tab
2. **Home Dashboard** — Header, stats, next lesson card, today's schedule, FAB
3. **Pupils Tab** — Pupil list, search, filters, pupil profile sheet with all 4 tabs
4. **Schedule Tab** — Day/week/month calendar, add lesson sheet
5. **Money Tab** — Earnings dashboard, take payment sheet, expense tracker
6. **Track Tab** — Map view (static marker), trip history list, saved routes
7. **More Tab** — Feature grid, then build individual screens:
   - Messages (basic chat UI)
   - Test Results (fault recording form)
   - Vehicle Health (vehicle card)
   - Settings (profile + appearance)
   - Todos (simple task list)
   - Remaining screens

---

## 11. PHASE 2: AUTHENTICATION (Deferred)

When ready to add auth:

1. Install `@supabase/supabase-js` and configure with the credentials above
2. Add login screen (email + password) before tab navigation
3. After auth, resolve instructor: `SELECT * FROM instructors WHERE auth_user_id = auth.uid()`
4. Replace `DemoDataProvider` with real Supabase queries
5. Add `AsyncStorage` adapter for session persistence
6. Add biometric auth with `expo-local-authentication`
7. Store refresh token in `expo-secure-store`
8. Register push token: `INSERT INTO expo_push_tokens (instructor_id, token, platform)`

### Auth Flow (Future)
```
App Launch → Check stored session → 
  Valid? → Resolve instructor → Show tabs
  Invalid? → Show login screen → Auth → Store session → Show tabs
```

---

## 12. STORAGE BUCKETS (Reference)

| Bucket | Purpose |
|--------|---------|
| `instructor-images` | Profile photos |
| `pupil-avatars` | Pupil photos |
| `expense-receipts` | Receipt photos |
| `chat-attachments` | Chat media |
| `signatures` | T&C signatures |

Upload pattern (when connected):
```typescript
supabase.storage.from("bucket-name").upload(path, file);
```

---

## 13. REALTIME SUBSCRIPTIONS (Phase 2)

When Supabase is connected, subscribe to these for live updates:
```typescript
supabase.channel("messages").on("postgres_changes", { event: "*", schema: "public", table: "messages" }, handler).subscribe();
supabase.channel("scheduled_lessons").on("postgres_changes", { event: "*", schema: "public", table: "scheduled_lessons" }, handler).subscribe();
supabase.channel("gps_devices").on("postgres_changes", { event: "*", schema: "public", table: "gps_devices" }, handler).subscribe();
```

---

This prompt covers the complete instructor app. Build iteratively starting with the navigation shell and home dashboard. All screens work with demo data — no authentication or backend connection needed to start building.



# Reorganisation Plan for Instructor Menu & Settings

## Executive Summary

This plan reorganises the instructor navigation to reduce confusion, eliminate duplicates, and create a clearer mental model by grouping features into logical categories with consistent placement.

---

## Proposed Changes

### 1. Restructured Bottom Navigation Bar

Keep the current 6-item bottom nav but consider these minor refinements:

| Current | Proposed | Notes |
|---------|----------|-------|
| Home | Home | No change |
| Schedule | Schedule | No change |
| Track | Track | No change |
| Pay | Money | Rename for clarity - leads to financial hub |
| Pupils | Pupils | No change |
| Menu | More | Rename to "More" (industry standard) |

---

### 2. Restructured Menu Page (6 clear categories)

```text
┌─────────────────────────────────────────────┐
│  QUICK ACTIONS                              │
│  ├── Log Test Result (quick modal)          │
│  └── Full DL25A Test Report                 │
├─────────────────────────────────────────────┤
│  SCHEDULE & PUPILS                          │
│  ├── Schedule                               │
│  ├── Pupils                                 │
│  ├── Pending Scheduling                     │
│  ├── Job Offers                             │
│  └── Messages                               │
├─────────────────────────────────────────────┤
│  MONEY & REPORTS                            │
│  ├── Payments (received)                    │
│  ├── Expenses                               │
│  ├── Income Summary                         │
│  ├── Income vs Expenses                     │
│  └── Tax Summary                            │
├─────────────────────────────────────────────┤
│  TOOLS                                      │
│  ├── Track Lesson                           │
│  ├── Saved Routes                           │
│  └── Fill Gaps                              │
├─────────────────────────────────────────────┤
│  SETTINGS                                   │
│  └── Settings (single link to settings)    │
│  └── Mini-Website                           │
│  └── FAQs & Help                            │
├─────────────────────────────────────────────┤
│  ACCOUNT                                    │
│  ├── My Profile                             │
│  └── Sign Out                               │
└─────────────────────────────────────────────┘
```

**Key changes:**
- Messages moved from Tools → Schedule & Pupils (communication with pupils)
- Financial items consolidated under "Money & Reports"
- Removed duplicate "Expenses" entry
- Removed "Accounts" (duplicate of Payment Summary in Settings)
- Settings section simplified to just link to the settings page

---

### 3. Restructured Settings Page (Grouped Sections)

Instead of 24 flat tiles, group them into **6 collapsible category headers**:

```text
┌─────────────────────────────────────────────┐
│ 👤 PROFILE & IDENTITY                       │
│    ├── Profile (name, photo, bio)           │
│    ├── Vehicle & Qualifications             │
│    └── ADI Certificate & Compliance         │
├─────────────────────────────────────────────┤
│ 📚 COURSES & PRICING                        │
│    ├── My Courses                           │
│    ├── Booking Mode                         │
│    ├── Deposit Settings                     │
│    └── Visibility                           │
├─────────────────────────────────────────────┤
│ 🌐 MINI-WEBSITE                             │
│    ├── Share Link                           │
│    ├── Website Pages                        │
│    └── Website Theme                        │
├─────────────────────────────────────────────┤
│ 📅 SCHEDULING & AVAILABILITY                │
│    ├── Working Hours                        │
│    ├── Calendar Sync                        │
│    └── Cancellation Policy                  │
├─────────────────────────────────────────────┤
│ 🚗 TRACKING & ROUTES                        │
│    ├── GPS Tracker Setup                    │
│    ├── Saved Routes                         │
│    └── Test Centres & Examiners             │
├─────────────────────────────────────────────┤
│ ⚙️ PREFERENCES & DATA                       │
│    ├── Push Notifications                   │
│    ├── Terms & Conditions                   │
│    ├── Bulk Messaging                       │
│    ├── Pupil App Branding                   │
│    ├── Images & Media                       │
│    ├── Data Export & Backup                 │
│    └── Reset Statistics                     │
└─────────────────────────────────────────────┘
```

---

## Implementation Approach

### Phase 1: Menu Reorganisation

1. **Update `InstructorMenu.tsx`**
   - Rename "Money" section to "Money & Reports"
   - Move Messages from Tools to Schedule & Pupils
   - Remove duplicate "Expenses" entry from Settings section
   - Move Income, In & Out, Tax Summary to Money & Reports section
   - Simplify Settings section to just "Settings", "Mini-Website", and "FAQs & Help"

2. **Update `InstructorBottomNav.tsx`** (optional)
   - Rename "Pay" to "Money"
   - Rename "Menu" to "More"

### Phase 2: Settings Page Reorganisation

1. **Create a new grouped layout for `InstructorSettings.tsx`**
   - Add category headers with collapse/expand functionality
   - Group tiles under appropriate headers
   - Use Accordion or nested Collapsible components
   - Add a "quick jump" navigation at the top showing all categories

2. **Create a sticky category navigation** (optional enhancement)
   - A horizontal scrollable pill bar at the top
   - Clicking a pill scrolls to that section

---

## Technical Implementation Details

### Menu Section Changes (InstructorMenu.tsx)

```typescript
const menuSections = [
  {
    title: "Quick Actions",
    items: [
      { icon: Award, label: "Log Test Result", action: () => setShowTestResultForm(true) },
      { icon: Award, label: "Full Test Report (DL25A)", path: "/instructor/test-results" },
    ],
  },
  {
    title: "Schedule & Pupils",
    items: [
      { icon: Calendar, label: "Schedule", path: "/instructor/schedule" },
      { icon: Users, label: "Pupils", path: "/instructor/pupils" },
      { icon: Clock, label: "Pending Scheduling", path: "/instructor/pending-scheduling" },
      { icon: Briefcase, label: "Job Offers", path: "/instructor/jobs" },
      { icon: MessageCircle, label: "Messages", path: "/instructor/messages" },
    ],
  },
  {
    title: "Money & Reports",
    items: [
      { icon: CreditCard, label: "Payments", path: "/instructor/pay" },
      { icon: Receipt, label: "Expenses", path: "/instructor/expenses" },
      { icon: TrendingUp, label: "Income Summary", path: "/instructor/income" },
      { icon: ArrowUpDown, label: "Income vs Expenses", path: "/instructor/in-out" },
      { icon: Calculator, label: "Tax Summary", path: "/instructor/tax" },
    ],
  },
  {
    title: "Tools",
    items: [
      { icon: Car, label: "Track Lesson", path: "/instructor/traccar" },
      { icon: Route, label: "Saved Routes", path: "/instructor/routes" },
      { icon: MapPin, label: "Fill Gaps", path: "/instructor/gaps" },
    ],
  },
  {
    title: "Settings",
    items: [
      { icon: Settings, label: "All Settings", path: "/instructor/settings" },
      { icon: Globe, label: "Mini-Website", path: "/instructor/website" },
      { icon: HelpCircle, label: "FAQs & Help", path: "/instructor/faqs" },
    ],
  },
  {
    title: "Account",
    items: [
      { icon: User, label: "My Profile", path: "/instructor/settings" },
      { icon: LogOut, label: "Sign Out", action: handleLogout },
    ],
  },
];
```

### Settings Page Category Structure

```typescript
const settingsCategories = [
  {
    id: "profile",
    title: "Profile & Identity",
    icon: User,
    tiles: ["profile", "details", "compliance"],
  },
  {
    id: "courses",
    title: "Courses & Pricing",
    icon: BookOpen,
    tiles: ["courses", "booking-mode", "deposits", "visibility", "payments"],
  },
  {
    id: "website",
    title: "Mini-Website",
    icon: Globe,
    tiles: ["mini-website", "website-pages", "website-theme"],
  },
  {
    id: "scheduling",
    title: "Scheduling & Availability",
    icon: Clock,
    tiles: ["working-hours", "calendar", "cancellation"],
  },
  {
    id: "tracking",
    title: "Tracking & Routes",
    icon: Navigation,
    tiles: ["traccar", "routes", "test-centres"],
  },
  {
    id: "preferences",
    title: "Preferences & Data",
    icon: Settings,
    tiles: [
      "notifications", "terms", "bulk-sms", "branding",
      "images", "data-backup", "reset-stats"
    ],
  },
];
```

---

## Visual Mockup: Settings Categories

```text
┌────────────────────────────────────────────────┐
│  ⚙️ Settings                                   │
│  Manage your profile and preferences           │
├────────────────────────────────────────────────┤
│                                                │
│  [Profile] [Courses] [Website] [Schedule] ...  │  ← Quick jump pills
│                                                │
├────────────────────────────────────────────────┤
│  ▼ 👤 Profile & Identity                       │  ← Category header
│  ┌──────────────────────────────────────────┐  │
│  │ 👤 Profile                                │  │
│  │    Your public instructor profile         │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │ 🚗 Vehicle & Qualifications               │  │
│  │    Car details, skills & social links     │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │ 🛡️ Compliance & CPD                       │  │
│  │    Track ADI badge, insurance, MOT        │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  ▶ 📚 Courses & Pricing                        │  ← Collapsed
│  ▶ 🌐 Mini-Website                             │  ← Collapsed
│  ▶ 📅 Scheduling & Availability                │  ← Collapsed
│  ...                                           │
└────────────────────────────────────────────────┘
```

---

## Benefits of This Approach

1. **Reduced cognitive load**: Users see 6 categories instead of 24 tiles
2. **Faster navigation**: Quick jump pills let users go directly to a section
3. **Logical grouping**: Related items are together
4. **No duplicates**: Each feature appears exactly once
5. **Clear separation**: Menu is for navigation, Settings is for configuration
6. **Consistent with mobile patterns**: Follows iOS/Android settings conventions

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/InstructorMenu.tsx` | Reorganise menu sections, remove duplicates |
| `src/pages/InstructorSettings.tsx` | Add category headers, group tiles, add quick-jump nav |
| `src/components/instructor/InstructorBottomNav.tsx` | Optional: rename Pay → Money, Menu → More |

---

## Alternative: Separate Settings Pages

Instead of one long settings page, you could split into dedicated pages:
- `/instructor/settings/profile`
- `/instructor/settings/courses`
- `/instructor/settings/website`
- etc.

This would make the main settings page a simple menu of cards linking to sub-pages. However, this adds more navigation steps and may not be necessary for the current feature set.


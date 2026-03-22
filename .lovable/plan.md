

## Plan: Switching Toolkit + Killer Features

### Phase 1: Remove Switching Barriers

**1. CSV Data Import Wizard** (`/instructor/import-data`)
- New page with file upload (CSV/XLSX)
- Column mapping UI (map their columns to: name, phone, email, lesson count, notes)
- Preview table before import
- Bulk insert into `pupils` table with the instructor's ID
- Auto-send SMS invite to imported pupils (optional)

**Database**: No schema changes — uses existing `pupils` table

**Files**:
| File | Change |
|------|--------|
| `src/pages/InstructorDataImport.tsx` | **New** — CSV upload + column mapper + preview + import |
| `src/components/instructor/ImportColumnMapper.tsx` | **New** — drag-and-drop column mapping UI |
| `src/routes/instructorPortalRoutes.tsx` | Add route |
| `src/components/instructor/InstructorDesktopSidebar.tsx` | Add nav item under TOOLS |

**2. "Switch to EveryDriver" Landing Page** (`/switch`)
- Public marketing page targeting competitor users
- Savings calculator (enter current monthly cost → see EveryDriver equivalent)
- Side-by-side feature comparison pulling from existing `comparison_features` table
- CTA → signup with import wizard
- Testimonial slots (placeholder initially)

**Files**:
| File | Change |
|------|--------|
| `src/pages/SwitchToEveryDriver.tsx` | **New** — landing page with calculator + comparison |
| `src/components/switch/SavingsCalculator.tsx` | **New** — interactive cost comparison widget |
| `src/routes/publicRoutes.tsx` (or equivalent) | Add `/switch` route |

### Phase 2: Killer Differentiators

**3. Instructor Referral Programme**

**Database migration**:
```sql
CREATE TABLE instructor_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES instructors(id) ON DELETE CASCADE,
  referred_email text NOT NULL,
  referred_instructor_id uuid REFERENCES instructors(id),
  status text DEFAULT 'pending', -- pending, signed_up, qualified (3mo), rewarded
  reward_amount numeric DEFAULT 10.00,
  created_at timestamptz DEFAULT now(),
  qualified_at timestamptz
);
ALTER TABLE instructor_referrals ENABLE ROW LEVEL SECURITY;
```

- Each instructor gets a unique referral code (their slug or generated)
- Dashboard card showing referral stats + shareable link
- Referral tracked at signup, qualified after 3 months active

**Files**:
| File | Change |
|------|--------|
| Database migration | Create `instructor_referrals` table |
| `src/components/instructor/ReferralCard.tsx` | **New** — dashboard card with referral link + stats |
| `src/components/instructor/InstructorDashboard.tsx` | Add referral card |
| Signup flow | Accept `?ref=CODE` param, store in referral table |

**4. WhatsApp Lesson Confirmations** (edge function)
- New edge function `send-whatsapp` using WhatsApp Business API (Cloud API, free tier: 1,000 conversations/mo)
- Toggle in instructor settings: "Send confirmations via WhatsApp instead of SMS"
- Falls back to SMS if WhatsApp delivery fails

**Files**:
| File | Change |
|------|--------|
| `supabase/functions/send-whatsapp/index.ts` | **New** — WhatsApp Cloud API sender |
| `src/components/instructor/InstructorSettingsForm.tsx` | Add WhatsApp toggle |
| Database migration | Add `whatsapp_enabled` boolean to `instructors` table |

### Phase 3: Marketing Weapons

**5. MTD Deadline Countdown Banner**
- Already planned/may exist — ensure it's prominent on homepage and instructor dashboard
- "X days until MTD deadline. We file for free. Others charge £12/mo."

**6. Comparison matrix updates**
- Add "Data Import Wizard", "Instructor Referrals", "WhatsApp Notifications" to `comparison_features`
- Mark as ✓ Free on EveryDriver, ✗ or "Extra cost" on competitors

### Implementation Order
1. CSV Import Wizard (biggest switching barrier remover)
2. Switch landing page (acquisition funnel)
3. Referral programme (viral growth)
4. WhatsApp integration (retention + differentiation)

### Total New Files: ~8 | Modified: ~5 | Migrations: 2


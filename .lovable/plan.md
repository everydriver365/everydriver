
# Community & Professionalism — Phase 1

Two tightly-scoped additions that together transform the platform from a tool into a professional network.

---

## 1. Verified Professional Profile (trust layer)

A badge stack on every instructor's mini-website and inside the portal — proves they're the real deal.

**Verifiable signals (pulled from existing data where possible):**
- DVSA ADI grade (4/5/6) + ADI number — manual entry, locked once verified by admin
- DBS check status + expiry — uploaded doc, admin-approved
- Public liability & vehicle insurance — uploaded doc + expiry tracking with auto-reminders
- CPD hours this year — auto-summed from CPD module
- Pass rate (last 12 months) — already tracked
- Years teaching — derived from `instructor.created_at` or manual
- Specialisms (nervous learners, automatic, intensive, refresher, pass plus, fleet)
- Languages spoken
- Pupil rating (already tracked)

**Display:**
- New **"Verified Pro" badge** block on every mini-website (above the fold, next to instructor name)
- Tap badge → expands a sheet showing all credentials with verification ticks
- Inside instructor portal: new **Credentials** settings page with upload + expiry tracker
- Admin portal: review queue for new uploads (approve/reject)

**Why it matters:** Removes the #1 pupil objection ("is this person legit?") and gives instructors a moat over Gumtree/Facebook competitors.

---

## 2. ADI Community Hub (the network effect)

A private, ADI-only space inside the instructor portal. Three tabs only — keep it focused.

### Tab A — **Feed**
- Threaded posts (text + optional image)
- Categories: Tips & Tricks, Test Routes, DVSA News, Vehicles, Vent (private to ADIs)
- Like, comment, save
- Optional pseudonym toggle ("Posting as @adi_winchester" vs real name)

### Tab B — **Swap Board**
Practical, transactional — what ADIs actually need:
- **Offer a pupil** (relocating, full diary, wrong gender match) → other ADIs in radius can claim
- **Cover request** (illness, holiday) → nearby ADIs see and bid
- **Vehicle swap** (mine's in for service, anyone free 9-1 Tuesday?)
- Each post auto-tags location from instructor's `home_postcode` and shows distance
- Acceptance creates a pre-filled handover with pupil contact, hours bought, syllabus progress

### Tab C — **Leaderboards** (opt-in)
- Regional pass-rate league (by postcode area)
- Most-improved this month
- Instructor of the Month (admin-curated, surfaces on Drive365 homepage)
- Opt-out toggle in settings — never surfaced without consent

---

## 3. Light recognition layer (free wins)

- "Founding Instructor" badge for everyone who joined before today's date — instant exclusivity
- Public profile URL bumps to a polished `/adi/{slug}` route reusing existing mini-website shell
- Verified Pro badge becomes shareable as a PNG ("I'm a Verified Pro on Drive365") for WhatsApp/Insta

---

## What we're explicitly **not** building yet

- Full CPD course library (use existing CPD log; courses come in Phase 2)
- Mentorship pairing (depth needed — Phase 2)
- Pupil-side community (separate scope; high moderation cost)
- Live events/ticketing (Phase 3)
- Direct ADI-to-ADI messaging (use existing unified inbox)

---

## Technical sketch

**New tables:**
```text
instructor_credentials       — type, value, doc_url, status, verified_by, expires_at
community_posts              — instructor_id, category, body, image_url, pseudonym, created_at
community_comments           — post_id, instructor_id, body
community_reactions          — post_id, instructor_id, kind
swap_board_listings          — instructor_id, kind (pupil/cover/vehicle), payload jsonb,
                               postcode_area, status, claimed_by, expires_at
leaderboard_opt_in           — instructor_id, leaderboard_kind, opted_in
```

**RLS:** All community tables use `public.get_instructor_id_for_user(auth.uid())` per the project rule. Swap-board claims gated to verified instructors only (anti-spam).

**Routes (desktop portal — mobile untouched per project rule):**
- `/instructor/community` — Feed / Swap Board / Leaderboards tabs
- `/instructor/settings/credentials` — Verified Pro upload + expiry tracker
- `/admin/verifications` — review queue
- Public: `/adi/{slug}` reuses existing mini-website shell with Verified Pro block

**Reuses:** existing CPD hooks, pass-rate calc, mini-website Polaroid shell, unified inbox, instructor `home_postcode` for distance, admin moderation patterns.

**Notifications:** Reuse existing notification system — new types: `swap_board.match_nearby`, `credential.expiry_warning`, `community.reply_to_your_post`.

**Design:** Desktop portal theme tokens (#2D3FE7 indigo, #00C8B8 teal accents), `--portal-*` cards, rounded-2xl. No new colors.

---

## Build order

1. **Verified Pro Profile** — credentials table, upload UI, admin review, badge on mini-website
2. **Swap Board** — highest ROI tab, fills empty diaries
3. **Feed** — categories + posting + moderation
4. **Leaderboards** — opt-in, regional

Each step is independently shippable. Want me to start with Step 1?

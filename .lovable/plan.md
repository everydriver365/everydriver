
The user wants a focused disabled-driver hub with: landing page, forum, adapted-vehicle garages directory, accessible instructor search, and trackers for disabled cars. I'll plan it as a Drive365 sub-section under `/accessible` so it reuses auth, payments, and instructor data.

## Plan: Drive365 Accessible Hub

### 1. Database (migration)

**Instructor accessibility fields** (extend `instructors`):
- `accessibility_enabled` boolean
- `adaptations` text[] — hand controls, left-foot accelerator, steering ball, pedal extensions, automatic only, wheelchair stowage
- `disability_experience` text[] — physical, visual, deaf/BSL, autism/ADHD, anxiety, learning difficulties, brain injury, stroke recovery
- `bsl_signing` boolean
- `motability_friendly` boolean
- `accessibility_bio` text

**New tables:**
- `accessible_garages` — name, address, postcode, lat/lng, phone, website, services text[] (hand controls fitting, wheelchair conversion, Motability servicing, MOT for adapted), motability_approved bool, verified bool
- `accessible_forum_topics` — title, body, author_user_id, category (adaptations, motability, learning, tests, vehicles), reply_count, last_reply_at
- `accessible_forum_replies` — topic_id, author_user_id, body
- `accessible_trackers` — name, brand (Quartix/Geotab/Radius/etc), supports_adaptations bool, features text[], price_monthly, fitting_required bool, image_url, affiliate_url

RLS: forum readable by anyone; write requires auth. Garages/trackers read-public, write admin-only.

### 2. Routes (new, under `/accessible`)

| Route | Purpose |
|---|---|
| `/accessible` | Landing page — hero, who we help, 4 hub tiles (Instructors, Forum, Garages, Trackers), Motability info, FAQ |
| `/accessible/instructors` | Filtered instructor directory (adaptations, BSL, experience tags) + postcode search |
| `/accessible/forum` | Topic list + filter by category |
| `/accessible/forum/:id` | Topic + replies + post reply |
| `/accessible/forum/new` | Start topic (auth-gated) |
| `/accessible/garages` | Searchable directory of adapted-vehicle garages by postcode + radius |
| `/accessible/trackers` | Tracker comparison grid for disabled/adapted cars |

All whitelisted in `DomainRouter.tsx` so they live on `drive365.co.uk`.

### 3. Components (new)

- `AccessibleHero`, `AccessibleHubTiles`, `AccessibilityBadges`
- `AccessibilityFilter` (shared with `/courses`)
- `GarageCard`, `GarageSearchBar`
- `ForumTopicList`, `ForumTopicCard`, `ForumReplyThread`, `NewTopicForm`
- `TrackerCard`, `TrackerCompareGrid`

### 4. Instructor portal (light touch)

- New settings page `/instructor/accessibility` — toggle profile, pick adaptations, experience, BSL, Motability, write bio.

### 5. Seed data

- Seed ~10 well-known UK adapted-vehicle garages (Brotherwood, Allied Mobility, Lewis Reed, GM Coachwork, etc.) — verified=false until admin confirms.
- Seed 4–6 trackers with adaptation-friendly notes.
- Seed 3 starter forum topics so the forum doesn't look empty.

### Files

**New**
- `src/pages/accessible/AccessibleHome.tsx`
- `src/pages/accessible/AccessibleInstructors.tsx`
- `src/pages/accessible/AccessibleForum.tsx`
- `src/pages/accessible/AccessibleForumTopic.tsx`
- `src/pages/accessible/AccessibleForumNew.tsx`
- `src/pages/accessible/AccessibleGarages.tsx`
- `src/pages/accessible/AccessibleTrackers.tsx`
- `src/pages/instructor/InstructorAccessibilitySettings.tsx`
- `src/components/accessible/*` (cards, filters, badges)

**Edited**
- `src/routes/publicRoutes.tsx` — register `/accessible/*`
- `src/routes/instructorPortalRoutes.tsx` — accessibility settings
- `src/components/DomainRouter.tsx` — whitelist `/accessible`

### Out of scope
- Standalone domain
- Real-time tracker telemetry (links/affiliate only for now)
- Forum moderation queue (basic report flag only)
- Motability scheme application flow

### Verification
- `/accessible` loads on drive365.co.uk with 4 hub tiles
- Instructor toggles accessibility → appears in `/accessible/instructors` with badges
- Posting a forum topic + reply works (auth required)
- Garage search by postcode returns seeded garages within radius
- Tracker grid renders with seeded items

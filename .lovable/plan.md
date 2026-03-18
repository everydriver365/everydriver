

## Plan: Add "Platform Updates" Tile + Feature Request & Voting Page

### Overview
Add a "Platform Updates" quick action tile to the instructor home page that links to a new page where instructors can view platform updates and suggest/vote on new features.

### Database Changes

**1. `platform_updates` table** — admin-posted updates
- `id` (uuid, PK), `title` (text), `description` (text), `category` (text: 'feature'|'improvement'|'bugfix'), `created_at`, `is_published` (boolean)

**2. `feature_suggestions` table** — instructor-submitted ideas
- `id` (uuid, PK), `instructor_id` (uuid, FK→instructors), `title` (text), `description` (text), `status` (text: 'open'|'planned'|'completed'|'declined'), `created_at`, `upvotes` (int default 0), `downvotes` (int default 0)

**3. `feature_suggestion_votes` table** — one vote per instructor per suggestion
- `id` (uuid, PK), `suggestion_id` (uuid, FK→feature_suggestions), `instructor_id` (uuid, FK→instructors), `vote` (smallint: 1 or -1), unique on (suggestion_id, instructor_id)

RLS: Authenticated users can read all rows; instructors can insert suggestions and votes for themselves; votes are upsert-able.

### Code Changes

**1. `HomeQuickActions.tsx`** — Add tile:
```
{ id: "platform-updates", label: "Updates", subtitle: "News & ideas", icon: Megaphone, iconColor: "text-indigo-600", route: "/instructor/platform-updates" }
```

**2. New page: `src/pages/InstructorPlatformUpdates.tsx`**
- Two tabs: "Updates" and "Feature Requests"
- Updates tab: lists published platform updates (read-only cards)
- Feature Requests tab: list of suggestions sorted by net votes, with upvote/downvote buttons; form to submit a new suggestion
- Each vote button shows count; active state when the current user has voted

**3. `src/App.tsx`** — Add route:
```
<Route path="/instructor/platform-updates" element={<InstructorPlatformUpdates />} />
```

**4. `InstructorMenu.tsx`** — Add menu entry in an appropriate section.

